import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { EntityManager } from '@mikro-orm/core';
import { ModerationService, ModerationResult } from './moderation.service';
import { AiService } from '../ai/ai.service';
import { NotificationService } from '../notification/notification.service';
import { GamificationService } from '../gamification/gamification.service';
import { SocialPost } from './entities/social-post.entity';
import { SocialComment } from './entities/social-comment.entity';
import { ModerationViolation, ViolationType, ContentType } from './entities/moderation-violation.entity';
import { UserGamification } from '../gamification/entities/user-gamification.entity';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makePost(overrides: Partial<SocialPost> = {}): SocialPost {
    return Object.assign(new SocialPost(), {
        id: 'post-1',
        content: 'Hello world',
        status: 'pending',
        score: 0,
        likesCount: 0,
        commentsCount: 0,
        tags: [],
        media: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
    });
}

function makeComment(overrides: Partial<SocialComment> = {}): SocialComment {
    return Object.assign(new SocialComment(), {
        id: 'comment-1',
        content: 'Nice post!',
        status: 'pending',
        createdAt: new Date(),
        ...overrides,
    });
}

function makeGamification(overrides: Partial<UserGamification> = {}): UserGamification {
    return Object.assign(new UserGamification(), {
        id: 'gam-1',
        xp: 0,
        level: 1,
        badges: [],
        currentStreak: 0,
        reputationPoints: 100,
        violationCount: 0,
        mutedUntil: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
    });
}

// ─── Test Suite ───────────────────────────────────────────────────────────────

describe('ModerationService', () => {
    let service: ModerationService;

    // Mocks
    let postRepo: jest.Mocked<any>;
    let commentRepo: jest.Mocked<any>;
    let violationRepo: jest.Mocked<any>;
    let gamificationRepo: jest.Mocked<any>;
    let em: jest.Mocked<any>;
    let aiService: jest.Mocked<AiService>;
    let notificationService: jest.Mocked<NotificationService>;
    let gamificationService: jest.Mocked<GamificationService>;

    beforeEach(async () => {
        postRepo = { findOne: jest.fn(), nativeUpdate: jest.fn() };
        commentRepo = { findOne: jest.fn(), nativeUpdate: jest.fn() };
        violationRepo = {};
        gamificationRepo = { findOne: jest.fn() };
        em = {
            persistAndFlush: jest.fn().mockResolvedValue(undefined),
            persist: jest.fn(),
            flush: jest.fn().mockResolvedValue(undefined),
            getReference: jest.fn().mockReturnValue({ id: 'user-1' }),
            // fork() returns `em` itself so forked calls use the same mock
            fork: jest.fn().mockReturnThis(),
            findOne: jest.fn(),
            nativeUpdate: jest.fn().mockResolvedValue(1),
        };
        aiService = { generateContent: jest.fn() } as any;
        notificationService = { emitToUser: jest.fn() } as any;
        gamificationService = { getGamification: jest.fn() } as any;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ModerationService,
                { provide: getRepositoryToken(SocialPost), useValue: postRepo },
                { provide: getRepositoryToken(SocialComment), useValue: commentRepo },
                { provide: getRepositoryToken(ModerationViolation), useValue: violationRepo },
                { provide: getRepositoryToken(UserGamification), useValue: gamificationRepo },
                { provide: EntityManager, useValue: em },
                { provide: AiService, useValue: aiService },
                { provide: NotificationService, useValue: notificationService },
                { provide: GamificationService, useValue: gamificationService },
            ],
        }).compile();

        service = module.get<ModerationService>(ModerationService);
    });

    // ─── isUserMuted ───────────────────────────────────────────────────────────

    describe('isUserMuted()', () => {
        it('returns muted=false when no gamification record', async () => {
            gamificationRepo.findOne.mockResolvedValue(null);
            const result = await service.isUserMuted('user-1');
            expect(result).toEqual({ muted: false });
        });

        it('returns muted=false when mutedUntil is not set', async () => {
            gamificationRepo.findOne.mockResolvedValue(makeGamification());
            const result = await service.isUserMuted('user-1');
            expect(result).toEqual({ muted: false });
        });

        it('returns muted=true when mutedUntil is in the future', async () => {
            const future = new Date(Date.now() + 3_600_000); // +1h
            gamificationRepo.findOne.mockResolvedValue(makeGamification({ mutedUntil: future }));
            const result = await service.isUserMuted('user-1');
            expect(result.muted).toBe(true);
            expect(result.mutedUntil).toEqual(future);
        });

        it('clears expired mute and returns muted=false', async () => {
            const past = new Date(Date.now() - 1000); // already expired
            const gam = makeGamification({ mutedUntil: past });
            gamificationRepo.findOne.mockResolvedValue(gam);
            const result = await service.isUserMuted('user-1');
            expect(result.muted).toBe(false);
            expect(gam.mutedUntil).toBeUndefined();
            expect(em.persistAndFlush).toHaveBeenCalledWith(gam);
        });
    });

    // ─── moderatePost — APPROVED paths ────────────────────────────────────────

    describe('moderatePost() — approved', () => {
        it('approves a clean post (AI says safe)', async () => {
            const post = makePost();
            em.findOne.mockResolvedValue(post);
            aiService.generateContent.mockResolvedValue('{"safe":true}');

            await service.moderatePost('post-1', 'user-1');

            expect(post.status).toBe('approved');
            expect(em.persistAndFlush).toHaveBeenCalledWith(post);
            expect(notificationService.emitToUser).toHaveBeenCalledWith(
                'user-1',
                'moderation_result',
                expect.objectContaining({ status: 'approved', contentId: 'post-1', contentType: 'post' }),
            );
        });

        it('approves when AI service throws (fail-open)', async () => {
            const post = makePost();
            em.findOne.mockResolvedValue(post);
            // Layer 1 passes (clean content), layer 2 throws
            aiService.generateContent.mockRejectedValue(new Error('API down'));

            await service.moderatePost('post-1', 'user-1');

            // Fail-open → still approved
            expect(post.status).toBe('approved');
        });

        it('skips already-approved post', async () => {
            em.findOne.mockResolvedValue(makePost({ status: 'approved' }));
            await service.moderatePost('post-1', 'user-1');
            expect(aiService.generateContent).not.toHaveBeenCalled();
            expect(em.persistAndFlush).not.toHaveBeenCalled();
        });

        it('fail-opens on unexpected repo error', async () => {
            em.findOne.mockRejectedValue(new Error('DB timeout'));

            await expect(service.moderatePost('post-1', 'user-1')).resolves.toBeUndefined();
            expect(em.nativeUpdate).toHaveBeenCalledWith(
                SocialPost,
                { id: 'post-1', status: 'pending' },
                { status: 'approved' },
            );
        });
    });

    // ─── moderatePost — REJECTED: Blacklist ────────────────────────────────────

    describe('moderatePost() — rejected (Blacklist)', () => {
        const BLACKLIST_CASES = [
            // Vietnamese profanity
            'đây là nội dung chứa đm rõ ràng',
            'thằng chó không biết gì',
            // Vietnamese abbreviation
            'vcl sao ngu vậy',
            // English profanity
            'what the fuck is this',
            'you are such a bitch',
            // Hate/violence
            'kill yourself loser',
            'you are worthless',
            // Spam domain
            'free money at http://spam.xyz',
        ];

        test.each(BLACKLIST_CASES)('rejects "%s" via blacklist', async (badContent) => {
            const post = makePost({ content: badContent });
            em.findOne.mockResolvedValue(post);
            const gam = makeGamification();
            gamificationService.getGamification.mockResolvedValue(gam);

            await service.moderatePost('post-1', 'user-1');

            expect(post.status).toBe('rejected');
            // AI should NOT be called — blacklist is layer 1 (fast)
            expect(aiService.generateContent).not.toHaveBeenCalled();
            expect(notificationService.emitToUser).toHaveBeenCalledWith(
                'user-1',
                'moderation_result',
                expect.objectContaining({
                    status: 'rejected',
                    violationType: ViolationType.BLACKLIST,
                }),
            );
        });
    });

    // ─── moderatePost — REJECTED: AI ──────────────────────────────────────────

    describe('moderatePost() — rejected (AI)', () => {
        it('rejects when Gemini returns safe=false', async () => {
            const post = makePost({ content: 'Mày là thứ vô dụng không tương lai' }); // subtle hate
            em.findOne.mockResolvedValue(post);
            aiService.generateContent.mockResolvedValue(
                '{"safe":false,"reason":"Ngôn từ xúc phạm và hạ thấp cá nhân"}',
            );
            const gam = makeGamification();
            gamificationService.getGamification.mockResolvedValue(gam);

            await service.moderatePost('post-1', 'user-1');

            expect(post.status).toBe('rejected');
            expect(notificationService.emitToUser).toHaveBeenCalledWith(
                'user-1',
                'moderation_result',
                expect.objectContaining({
                    status: 'rejected',
                    violationType: ViolationType.AI_DETECTED,
                    reason: 'Ngôn từ xúc phạm và hạ thấp cá nhân',
                }),
            );
        });

        it('does NOT reject when Gemini returns safe=true', async () => {
            const post = makePost({ content: 'Tôi không đồng ý với quan điểm này.' });
            em.findOne.mockResolvedValue(post);
            aiService.generateContent.mockResolvedValue('{"safe":true}');

            await service.moderatePost('post-1', 'user-1');

            expect(post.status).toBe('approved');
        });
    });

    // ─── moderatePost — Reputation & Mute ─────────────────────────────────────

    describe('moderatePost() — gamification side-effects', () => {
        it('deducts 10 reputation points on violation', async () => {
            const post = makePost({ content: 'vcl sao ngu vậy' }); // vcl hits pattern 2
            em.findOne.mockResolvedValue(post);
            const gam = makeGamification({ reputationPoints: 100, violationCount: 0 });
            gamificationService.getGamification.mockResolvedValue(gam);

            await service.moderatePost('post-1', 'user-1');

            expect(gam.reputationPoints).toBe(90);
            expect(gam.violationCount).toBe(1);
        });

        it('reputation never goes below 0', async () => {
            const post = makePost({ content: 'what the fuck is this garbage' }); // English profanity
            em.findOne.mockResolvedValue(post);
            const gam = makeGamification({ reputationPoints: 5, violationCount: 0 });
            gamificationService.getGamification.mockResolvedValue(gam);

            await service.moderatePost('post-1', 'user-1');

            expect(gam.reputationPoints).toBe(0);
        });

        it('applies 24-hour mute when violationCount reaches threshold (3)', async () => {
            const post = makePost({ content: 'vcl clgt đmm' });
            em.findOne.mockResolvedValue(post);
            // Already at 2 violations → this one pushes it to 3 → mute
            const gam = makeGamification({ reputationPoints: 80, violationCount: 2 });
            gamificationService.getGamification.mockResolvedValue(gam);

            const before = new Date();
            await service.moderatePost('post-1', 'user-1');
            const after = new Date();

            expect(gam.violationCount).toBe(3);
            expect(gam.mutedUntil).toBeDefined();
            // mutedUntil should be ~24h from now
            const diffHours = (gam.mutedUntil!.getTime() - before.getTime()) / 3_600_000;
            expect(diffHours).toBeGreaterThanOrEqual(23.9);
            expect(diffHours).toBeLessThanOrEqual(24.1);
        });

        it('does NOT re-apply mute if user is already muted', async () => {
            const post = makePost({ content: 'đm vcl' });
            em.findOne.mockResolvedValue(post);
            const existingMute = new Date(Date.now() + 3_600_000);
            const gam = makeGamification({
                reputationPoints: 60,
                violationCount: 5,
                mutedUntil: existingMute,
            });
            gamificationService.getGamification.mockResolvedValue(gam);

            await service.moderatePost('post-1', 'user-1');

            // mutedUntil should be unchanged
            expect(gam.mutedUntil).toEqual(existingMute);
        });
    });

    // ─── moderateComment ──────────────────────────────────────────────────────

    describe('moderateComment()', () => {
        it('approves a clean comment', async () => {
            const comment = makeComment({ content: 'Great post, thanks!' });
            em.findOne.mockResolvedValue(comment);
            aiService.generateContent.mockResolvedValue('{"safe":true}');

            await service.moderateComment('comment-1', 'user-1');

            expect(comment.status).toBe('approved');
            expect(notificationService.emitToUser).toHaveBeenCalledWith(
                'user-1',
                'moderation_result',
                expect.objectContaining({ status: 'approved', contentType: 'comment' }),
            );
        });

        it('rejects a blacklisted comment', async () => {
            const comment = makeComment({ content: 'fuck this post' });
            em.findOne.mockResolvedValue(comment);
            const gam = makeGamification();
            gamificationService.getGamification.mockResolvedValue(gam);

            await service.moderateComment('comment-1', 'user-1');

            expect(comment.status).toBe('rejected');
            expect(aiService.generateContent).not.toHaveBeenCalled();
        });

        it('skips already-approved comment', async () => {
            em.findOne.mockResolvedValue(makeComment({ status: 'approved' }));
            await service.moderateComment('comment-1', 'user-1');
            expect(aiService.generateContent).not.toHaveBeenCalled();
        });

        it('fail-opens on unexpected error', async () => {
            em.findOne.mockRejectedValue(new Error('DB error'));

            await expect(service.moderateComment('comment-1', 'user-1')).resolves.toBeUndefined();
            expect(em.nativeUpdate).toHaveBeenCalledWith(
                SocialComment,
                { id: 'comment-1', status: 'pending' },
                { status: 'approved' },
            );
        });
    });

    // ─── WebSocket event payload ───────────────────────────────────────────────

    describe('_emitResult() — event payload shape', () => {
        it('emits correct approved payload', async () => {
            const post = makePost({ content: 'Học lập trình rất thú vị!' });
            em.findOne.mockResolvedValue(post);
            aiService.generateContent.mockResolvedValue('{"safe":true}');

            await service.moderatePost('post-1', 'user-42');

            expect(notificationService.emitToUser).toHaveBeenCalledWith(
                'user-42',
                'moderation_result',
                {
                    status: 'approved',
                    contentId: 'post-1',
                    contentType: 'post',
                    violationType: null,
                    reason: null,
                },
            );
        });

        it('emits correct rejected payload with reason', async () => {
            const post = makePost({ content: 'đm vcl đồ chó' });
            em.findOne.mockResolvedValue(post);
            const gam = makeGamification();
            gamificationService.getGamification.mockResolvedValue(gam);

            await service.moderatePost('post-1', 'user-42');

            expect(notificationService.emitToUser).toHaveBeenCalledWith(
                'user-42',
                'moderation_result',
                {
                    status: 'rejected',
                    contentId: 'post-1',
                    contentType: 'post',
                    violationType: ViolationType.BLACKLIST,
                    reason: 'Nội dung chứa từ ngữ bị cấm trong danh sách đen.',
                },
            );
        });
    });
});
