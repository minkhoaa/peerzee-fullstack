import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/core';
import { AiService } from '../ai/ai.service';
import { NotificationService } from '../notification/notification.service';
import { GamificationService } from '../gamification/gamification.service';
import { SocialPost } from './entities/social-post.entity';
import { SocialComment } from './entities/social-comment.entity';
import { ModerationViolation, ViolationType, ContentType } from './entities/moderation-violation.entity';
import { UserGamification } from '../gamification/entities/user-gamification.entity';
import { User } from '../user/entities/user.entity';

// ─── Blacklist: Vietnamese + English profanity / hate speech ─────────────────
// NOTE: JS \b only considers [a-zA-Z0-9_] as word chars, so it won't create
// boundaries around Vietnamese Unicode characters. Vietnamese patterns use
// Unicode-aware lookahead/lookbehind instead.
const BLACKLIST_PATTERNS: RegExp[] = [
    // ── Vietnamese: sexual profanity ─────────────────────────────────────────
    // Core vulgar terms + Southern Vietnamese variants (đụ/đụt) + sexual acts
    /(?<![\p{L}\d])(đ[ụù]t|cặc|l[ồo]n|buồi|đéo|vãi|đ[iị]t|đụ\s*mẹ|đụ\s*má|đụ\s*cha|địt\s*mẹ|địt\s*má|đéo\s*mẹ|bú\s*cặc|bú\s*l[ồo]n|dái|nứng|dâm\s*dục|làm\s*tình\s*với\s*(tao|mày))(?![\p{L}\d])/iu,

    // ── Vietnamese: insults, slurs & degrading phrases ────────────────────────
    /(?<![\p{L}\d])(chó\s*chết|con\s*đĩ|đĩ\s*điếm|con\s*điếm|điếm\s*nhục|thằng\s*chó|con\s*chó|đồ\s*chó|mẹ\s*ki[eê]p|khốn\s*nạn|khốn\s*kiếp|tổ\s*cha\s*mày|tổ\s*sư\s*mày|tiên\s*sư\s*mày|tổ\s*cha\s*mẹ|chết\s*tiệt|chết\s*mẹ|chết\s*cha|chết\s*đi|cút\s*đi|xéo\s*đi|súc\s*vật|đồ\s*súc\s*vật|hèn\s*mạt|bần\s*tiện|đê\s*tiện|vô\s*lại|đồ\s*phản\s*bội)(?![\p{L}\d])/iu,

    // ── Vietnamese: stupidity & body-based insults ────────────────────────────
    /(?<![\p{L}\d])(đồ\s*ngu|thằng\s*ngu|con\s*ngu|ngu\s*như\s*[a-zàáâãèéêìíòóôõùúýăđưởợạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỷỹ]+|óc\s*l[ồo]n|óc\s*bã\s*đậu|óc\s*cặc|mặt\s*l[ồo]n|mặt\s*cặc|thằng\s*điên|con\s*điên|đồ\s*điên|vô\s*học|vô\s*văn\s*hóa|đầu\s*bò|đầu\s*gỗ|ngu\s*bỏ\s*mẹ|ngu\s*vl|cặc\s*biết)(?![\p{L}\d])/iu,

    // ── Vietnamese: abbreviations & internet slang ────────────────────────────
    /(?<![\p{L}\d])(đm|đcm|đml|đmm|vcl|vl|vcc|đkm|đkmc|clgt|óc\s*chó|cứt|cục\s*cứt|đéo\s*hiểu|đéo\s*quan\s*tâm|đéo\s*cần|phò|cave|gái\s*bán\s*hoa|gái\s*ngành)(?![\p{L}\d])/iu,

    // ── English: profanity ────────────────────────────────────────────────────
    /\b(f+u+c+k+(\s*(you|off|ing|ed))?|sh[i1]+t|b[i1]+tch|a+s+s+h+o+l+e+|c+u+n+t+|fag+ot|wh[o0]re|cock\s*(sucker)?|d[i1]ck\s*(head)?|p[uo]ssy|bastard|motherf\w+|son\s+of\s+a\s+b[i1]tch|r[e3]t[a4]rd|dickhead|jackass|dumbass|numbnuts)\b/i,

    // ── English: racial & ethnic slurs ───────────────────────────────────────
    /\b(n[i1]gg[ae]r|n[i1]gga|k[i1]ke|sp[i1]+c|ch[i1]+nk|g[o0]{2}k|[cg]oon|j[i1]g+aboo|cracker\s+ass)\b/i,

    // ── English: hate / violence / self-harm triggers ────────────────────────
    /\b(k[i1]ll\s+your?self|kys|go\s+(die|kill\s+your?self)|eat\s+sh[i1]t|go\s+f+u+c+k\s+your?self|you('re|\s+are)\s+(worthless|garbage|trash|subhuman|a\s+waste)|i\s+hope\s+you\s+die|die\s+in\s+a\s+fire)\b/i,

    // ── Vietnamese: threats & severe hostility ────────────────────────────────
    /(?<![\p{L}\d])(tao\s*(sẽ\s*)?(giết|đánh|đập)\s*(mày|bọn\s*mày)|mày\s*(chết|thua\s*con)\s*(đi|thôi)|triệt\s*hạ\s*mày|làm\s*nhục\s*mày)(?![\p{L}\d])/iu,

    // ── Suspicious spam / scam domains ───────────────────────────────────────
    /(https?:\/\/[^\s]+\.(xyz|tk|ml|cf|gq|pw|top|click|download))/i,
];

const MUTE_THRESHOLD = 3;           // violations before silencing
const MUTE_DURATION_HOURS = 24;     // hours of silence
const REPUTATION_DEDUCTION = 10;    // reputation points per violation

export interface ModerationResult {
    safe: boolean;
    violationType?: ViolationType;
    reason?: string;
}

@Injectable()
export class ModerationService {
    private readonly logger = new Logger(ModerationService.name);

    constructor(
        @InjectRepository(SocialPost)
        private readonly postRepo: EntityRepository<SocialPost>,
        @InjectRepository(SocialComment)
        private readonly commentRepo: EntityRepository<SocialComment>,
        @InjectRepository(ModerationViolation)
        private readonly violationRepo: EntityRepository<ModerationViolation>,
        @InjectRepository(UserGamification)
        private readonly gamificationRepo: EntityRepository<UserGamification>,
        private readonly em: EntityManager,
        private readonly aiService: AiService,
        private readonly notificationService: NotificationService,
        private readonly gamificationService: GamificationService,
    ) {}

    // ─── Public API ──────────────────────────────────────────────────────────

    /**
     * Check if user is currently muted.
     */
    async isUserMuted(userId: string): Promise<{ muted: boolean; mutedUntil?: Date }> {
        const gam = await this.gamificationRepo.findOne({ user: { id: userId } });
        if (!gam?.mutedUntil) return { muted: false };

        const now = new Date();
        if (gam.mutedUntil > now) {
            return { muted: true, mutedUntil: gam.mutedUntil };
        }

        // Mute expired — clear it
        gam.mutedUntil = undefined;
        await this.em.persistAndFlush(gam);
        return { muted: false };
    }

    /**
     * Moderate a post in the background (fire-and-forget from controller).
     * Uses a FORKED EntityManager so it never conflicts with the HTTP request EM.
     */
    async moderatePost(postId: string, userId: string): Promise<void> {
        // Fork to get an isolated EM — prevents identity-map conflicts with the
        // request-scoped EM that is still resolving getPost concurrently.
        const em = this.em.fork();
        try {
            const post = await em.findOne(SocialPost, { id: postId });
            if (!post || post.status !== 'pending') return;

            const result = await this._checkContent(post.content);

            if (result.safe) {
                post.status = 'approved';
                await em.persistAndFlush(post);
                this._emitResult(userId, 'approved', postId, 'post');
                this.logger.log(`Post ${postId} approved ✓`);
            } else {
                post.status = 'rejected';
                await em.persistAndFlush(post);
                await this._handleViolation(em, userId, post.content, ContentType.POST, result);
                this._emitResult(userId, 'rejected', postId, 'post', result.violationType, result.reason);
                this.logger.log(`Post ${postId} rejected — ${result.violationType}: ${result.reason}`);
            }
        } catch (err) {
            this.logger.error(`moderatePost(${postId}) error:`, err);
            // Fail-open: approve on unexpected errors to avoid blocking users
            const fallbackEm = this.em.fork();
            await fallbackEm.nativeUpdate(SocialPost, { id: postId, status: 'pending' }, { status: 'approved' });
            this._emitResult(userId, 'approved', postId, 'post');
        }
    }

    /**
     * Moderate a comment in the background.
     * Uses a FORKED EntityManager — same reasoning as moderatePost.
     */
    async moderateComment(commentId: string, userId: string): Promise<void> {
        const em = this.em.fork();
        try {
            const comment = await em.findOne(SocialComment, { id: commentId });
            if (!comment || comment.status !== 'pending') return;

            const result = await this._checkContent(comment.content);

            if (result.safe) {
                comment.status = 'approved';
                await em.persistAndFlush(comment);
                this._emitResult(userId, 'approved', commentId, 'comment');
            } else {
                comment.status = 'rejected';
                await em.persistAndFlush(comment);
                await this._handleViolation(em, userId, comment.content, ContentType.COMMENT, result);
                this._emitResult(userId, 'rejected', commentId, 'comment', result.violationType, result.reason);
            }
        } catch (err) {
            this.logger.error(`moderateComment(${commentId}) error:`, err);
            const fallbackEm = this.em.fork();
            await fallbackEm.nativeUpdate(SocialComment, { id: commentId, status: 'pending' }, { status: 'approved' });
            this._emitResult(userId, 'approved', commentId, 'comment');
        }
    }

    // ─── Private helpers ─────────────────────────────────────────────────────

    /**
     * Layer 1: Blacklist regex check (sync, fast).
     * Layer 2: Gemini AI context analysis (async).
     */
    private async _checkContent(text: string): Promise<ModerationResult> {
        // ── Layer 1 ──
        for (const pattern of BLACKLIST_PATTERNS) {
            if (pattern.test(text)) {
                return {
                    safe: false,
                    violationType: ViolationType.BLACKLIST,
                    reason: 'Nội dung chứa từ ngữ bị cấm trong danh sách đen.',
                };
            }
        }

        // ── Layer 2: Gemini AI ──
        try {
            const prompt = `Bạn là kiểm duyệt viên nghiêm khắc cho mạng cộng đồng Peerzee.

Phân tích nội dung:
"""
${text.substring(0, 1000)}
"""

VI PHẠM nếu chứa: ngôn từ thù ghét, kỳ thị, quấy rối, đe dọa cá nhân, nội dung tình dục/bạo lực rõ ràng, kêu gọi tự tử.
KHÔNG vi phạm: ý kiến khác biệt ôn hòa, chỉ trích xây dựng, nội dung học thuật, hài hước lành mạnh.

Trả lời JSON (không markdown):
{"safe":true} hoặc {"safe":false,"reason":"<lý do ngắn, dưới 80 ký tự>"}`;

            const raw = await this.aiService.generateContent(prompt, 'gemini-2.0-flash');
            const cleaned = raw.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
            const parsed: { safe: boolean; reason?: string } = JSON.parse(cleaned);

            if (parsed.safe === false) {
                return {
                    safe: false,
                    violationType: ViolationType.AI_DETECTED,
                    reason: parsed.reason ?? 'Nội dung vi phạm tiêu chuẩn cộng đồng.',
                };
            }
        } catch (err) {
            // AI failure → fail-open (don't block user)
            this.logger.warn('AI moderation unavailable, defaulting safe:', (err as Error)?.message);
        }

        return { safe: true };
    }

    /**
     * Record violation, deduct reputation, apply mute if threshold exceeded.
     */
    private async _handleViolation(
        em: EntityManager,
        userId: string,
        content: string,
        contentType: ContentType,
        result: ModerationResult,
    ): Promise<void> {
        // 1. Save violation log
        const violation = new ModerationViolation();
        violation.user = em.getReference(User, userId);
        violation.violationType = result.violationType!;
        violation.contentType = contentType;
        violation.contentSnippet = content.substring(0, 500);
        violation.reason = result.reason;
        violation.reputationDeducted = REPUTATION_DEDUCTION;
        em.persist(violation);

        // 2. Update gamification record
        const gam = await this.gamificationService.getGamification(userId);
        gam.reputationPoints = Math.max(0, (gam.reputationPoints ?? 100) - REPUTATION_DEDUCTION);
        gam.violationCount = (gam.violationCount ?? 0) + 1;

        // 3. Apply mute if threshold reached
        if (gam.violationCount >= MUTE_THRESHOLD && !gam.mutedUntil) {
            const mutedUntil = new Date();
            mutedUntil.setHours(mutedUntil.getHours() + MUTE_DURATION_HOURS);
            gam.mutedUntil = mutedUntil;
            this.logger.warn(`User ${userId} silenced until ${mutedUntil.toISOString()}`);
        }

        await em.persistAndFlush(gam);
        await em.flush();
    }

    /**
     * Fire moderation_result WebSocket event to the content owner's room.
     */
    private _emitResult(
        userId: string,
        status: 'approved' | 'rejected',
        contentId: string,
        contentType: 'post' | 'comment',
        violationType?: ViolationType,
        reason?: string,
    ): void {
        this.notificationService.emitToUser(userId, 'moderation_result', {
            status,
            contentId,
            contentType,
            violationType: violationType ?? null,
            reason: reason ?? null,
        });
    }
}