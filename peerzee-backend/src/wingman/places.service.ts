import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/core';
import { UserProfile } from '../user/entities/user-profile.entity';
import { DateSpot } from './wingman-tools';
import { AiService } from '../ai/ai.service';

interface LatLng {
    lat: number;
    lng: number;
}

interface OverpassPlace {
    id: number;
    lat: number;
    lon: number;
    tags: {
        name?: string;
        amenity?: string;
        leisure?: string;
        opening_hours?: string;
        'addr:street'?: string;
        'addr:housenumber'?: string;
        'addr:city'?: string;
        cuisine?: string;
    };
}

/**
 * PlacesService - Find date spots using OpenStreetMap Overpass API (FREE)
 */
@Injectable()
export class PlacesService {
    private readonly logger = new Logger(PlacesService.name);
    private readonly OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

    constructor(
        @InjectRepository(UserProfile)
        private readonly profileRepo: EntityRepository<UserProfile>,
        private readonly em: EntityManager,
        private readonly aiService: AiService,
    ) {}

    /**
     * Find date spots near both users
     */
    async findDateSpots(
        userId: string,
        matchUserId: string,
        preferences?: string[],
    ): Promise<DateSpot[]> {
        // Get both users' locations
        const [userProfile, matchProfile] = await Promise.all([
            this.profileRepo.findOne({ user: { id: userId } }),
            this.profileRepo.findOne({ user: { id: matchUserId } }),
        ]);

        if (!userProfile?.latitude || !userProfile?.longitude) {
            this.logger.warn(`User ${userId} has no location set`);
            return this.getDefaultSuggestions('Bạn chưa set vị trí');
        }

        if (!matchProfile?.latitude || !matchProfile?.longitude) {
            this.logger.warn(`Match ${matchUserId} has no location set`);
            return this.getDefaultSuggestions('Match chưa set vị trí');
        }

        const user1Location: LatLng = {
            lat: userProfile.latitude,
            lng: userProfile.longitude,
        };

        const user2Location: LatLng = {
            lat: matchProfile.latitude,
            lng: matchProfile.longitude,
        };

        // Calculate midpoint
        const midpoint = this.calculateMidpoint(user1Location, user2Location);
        this.logger.log(`Midpoint: ${midpoint.lat}, ${midpoint.lng}`);

        // Determine search radius based on distance between users
        const userDistance = this.calculateDistance(user1Location, user2Location);
        const searchRadius = Math.min(Math.max(userDistance * 0.5, 1000), 5000); // 1-5km

        try {
            // Query OpenStreetMap for places
            const places = await this.queryOverpass(midpoint, searchRadius, preferences);
            this.logger.log(`Found ${places.length} places from Overpass`);

            if (places.length === 0) {
                return this.getDefaultSuggestions('Không tìm thấy địa điểm phù hợp');
            }

            // Convert to DateSpot format with distances
            const dateSpots = places.map((place) => this.convertToDateSpot(
                place,
                user1Location,
                user2Location,
            ));

            // Sort by average distance (fairest for both)
            dateSpots.sort((a, b) => a.avgDistance - b.avgDistance);

            // Get AI recommendations for top spots
            const rankedSpots = await this.rankWithAI(
                dateSpots.slice(0, 10),
                userProfile,
                matchProfile,
                preferences,
            );

            return rankedSpots.slice(0, 5);
        } catch (error) {
            this.logger.error('Failed to query places:', error);
            return this.getDefaultSuggestions('Lỗi tìm kiếm địa điểm');
        }
    }

    /**
     * Calculate midpoint between two locations
     */
    private calculateMidpoint(loc1: LatLng, loc2: LatLng): LatLng {
        // Simple midpoint (good enough for nearby locations)
        return {
            lat: (loc1.lat + loc2.lat) / 2,
            lng: (loc1.lng + loc2.lng) / 2,
        };
    }

    /**
     * Calculate distance between two points in meters
     */
    private calculateDistance(loc1: LatLng, loc2: LatLng): number {
        const R = 6371000; // Earth radius in meters
        const dLat = this.toRad(loc2.lat - loc1.lat);
        const dLng = this.toRad(loc2.lng - loc1.lng);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRad(loc1.lat)) *
                Math.cos(this.toRad(loc2.lat)) *
                Math.sin(dLng / 2) *
                Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    private toRad(deg: number): number {
        return deg * (Math.PI / 180);
    }

    /**
     * Query OpenStreetMap Overpass API for nearby places
     */
    private async queryOverpass(
        center: LatLng,
        radius: number,
        preferences?: string[],
    ): Promise<OverpassPlace[]> {
        // Build amenity/leisure filters based on preferences
        const defaultTypes = ['cafe', 'restaurant', 'bar'];
        const types = preferences?.length ? preferences : defaultTypes;

        const amenityFilters = types
            .filter((t) => ['cafe', 'restaurant', 'bar', 'fast_food', 'pub'].includes(t))
            .map((t) => `node["amenity"="${t}"](around:${radius},${center.lat},${center.lng});`)
            .join('\n        ');

        const leisureFilters = types
            .filter((t) => ['park', 'garden'].includes(t))
            .map((t) => `node["leisure"="${t}"](around:${radius},${center.lat},${center.lng});`)
            .join('\n        ');

        // Default to cafe if no specific filters
        const filters = [amenityFilters, leisureFilters].filter(Boolean).join('\n        ') ||
            `node["amenity"="cafe"](around:${radius},${center.lat},${center.lng});
        node["amenity"="restaurant"](around:${radius},${center.lat},${center.lng});`;

        const query = `
            [out:json][timeout:25];
            (
                ${filters}
            );
            out body;
        `;

        this.logger.debug(`Overpass query: ${query}`);

        const response = await fetch(this.OVERPASS_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `data=${encodeURIComponent(query)}`,
        });

        if (!response.ok) {
            throw new Error(`Overpass API error: ${response.status}`);
        }

        const data = await response.json();
        return (data.elements || []).filter((el: OverpassPlace) => el.tags?.name);
    }

    /**
     * Convert Overpass place to DateSpot format
     */
    private convertToDateSpot(
        place: OverpassPlace,
        user1Loc: LatLng,
        user2Loc: LatLng,
    ): DateSpot {
        const placeLoc: LatLng = { lat: place.lat, lng: place.lon };
        const distFromUser = this.calculateDistance(user1Loc, placeLoc) / 1000; // km
        const distFromMatch = this.calculateDistance(user2Loc, placeLoc) / 1000; // km

        // Determine type from amenity/leisure
        let type: DateSpot['type'] = 'other';
        if (place.tags.amenity === 'cafe') type = 'cafe';
        else if (place.tags.amenity === 'restaurant') type = 'restaurant';
        else if (place.tags.amenity === 'bar' || place.tags.amenity === 'pub') type = 'bar';
        else if (place.tags.leisure === 'park' || place.tags.leisure === 'garden') type = 'park';

        // Build address
        const addressParts = [
            place.tags['addr:housenumber'],
            place.tags['addr:street'],
            place.tags['addr:city'],
        ].filter(Boolean);
        const address = addressParts.length > 0 ? addressParts.join(', ') : 'Địa chỉ không rõ';

        return {
            id: place.id.toString(),
            name: place.tags.name || 'Unknown',
            type,
            address,
            coordinates: placeLoc,
            distanceFromYou: Math.round(distFromUser * 10) / 10,
            distanceFromMatch: Math.round(distFromMatch * 10) / 10,
            avgDistance: Math.round(((distFromUser + distFromMatch) / 2) * 10) / 10,
            whyRecommended: '',
            openingHours: place.tags.opening_hours,
            googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lon}`,
        };
    }

    /**
     * Use AI to rank and describe date spots
     */
    private async rankWithAI(
        spots: DateSpot[],
        userProfile: UserProfile,
        matchProfile: UserProfile,
        preferences?: string[],
    ): Promise<DateSpot[]> {
        if (spots.length === 0) return spots;

        const spotsInfo = spots.map((s) => ({
            name: s.name,
            type: s.type,
            avgDistance: s.avgDistance,
            openingHours: s.openingHours,
        }));

        const prompt = `Bạn là dating coach. Đây là danh sách địa điểm hẹn hò tiềm năng:
${JSON.stringify(spotsInfo, null, 2)}

Thông tin về 2 người:
- User: ${userProfile.display_name}, thích ${userProfile.tags?.slice(0, 5).join(', ') || 'chưa rõ'}
- Match: ${matchProfile.display_name}, thích ${matchProfile.tags?.slice(0, 5).join(', ') || 'chưa rõ'}
${preferences?.length ? `- Preference: ${preferences.join(', ')}` : ''}

Hãy viết 1 câu ngắn gọn (dưới 20 từ) giải thích tại sao mỗi địa điểm phù hợp cho buổi hẹn. Tập trung vào atmosphere, phù hợp với sở thích chung.

Trả về JSON:
{
  "recommendations": [
    { "name": "Tên quán", "reason": "Lý do ngắn" },
    ...
  ]
}`;

        try {
            const result = await this.aiService.generateContent(prompt);
            const jsonMatch = result.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                return this.addDefaultReasons(spots);
            }

            const data = JSON.parse(jsonMatch[0]);
            const reasonMap = new Map(
                data.recommendations?.map((r: any) => [r.name.toLowerCase(), r.reason]) || [],
            );

            return spots.map((spot): DateSpot => ({
                ...spot,
                whyRecommended: (reasonMap.get(spot.name.toLowerCase()) as string) || this.getDefaultReason(spot),
            }));
        } catch (error) {
            this.logger.error('Failed to rank spots with AI:', error);
            return this.addDefaultReasons(spots);
        }
    }

    private addDefaultReasons(spots: DateSpot[]): DateSpot[] {
        return spots.map((spot) => ({
            ...spot,
            whyRecommended: this.getDefaultReason(spot),
        }));
    }

    private getDefaultReason(spot: DateSpot): string {
        const reasons: Record<string, string> = {
            cafe: 'Không gian yên tĩnh, perfect cho cuộc trò chuyện đầu tiên ☕',
            restaurant: 'Bữa ăn ngon sẽ làm buổi hẹn thêm đáng nhớ 🍽️',
            bar: 'Vibe chill, thích hợp cho buổi tối lãng mạn 🍷',
            park: 'Không gian thoáng đãng, tự nhiên và thoải mái 🌳',
            other: 'Địa điểm thú vị để khám phá cùng nhau ✨',
        };
        return reasons[spot.type] || reasons.other;
    }

    private getDefaultSuggestions(reason: string): DateSpot[] {
        return [
            {
                id: 'default-1',
                name: 'Gợi ý tổng quát',
                type: 'cafe',
                address: reason,
                coordinates: { lat: 0, lng: 0 },
                distanceFromYou: 0,
                distanceFromMatch: 0,
                avgDistance: 0,
                whyRecommended: 'Hãy set vị trí của bạn trong Profile để nhận gợi ý địa điểm cụ thể!',
                googleMapsUrl: '',
            },
        ];
    }

    /**
     * Search places by query (for manual search)
     */
    async searchPlaces(
        query: string,
        location: LatLng,
        radius: number = 3000,
    ): Promise<Omit<DateSpot, 'distanceFromMatch' | 'avgDistance'>[]> {
        const overpassQuery = `
            [out:json][timeout:25];
            (
                node["name"~"${query}",i]["amenity"](around:${radius},${location.lat},${location.lng});
                node["name"~"${query}",i]["leisure"](around:${radius},${location.lat},${location.lng});
            );
            out body;
        `;

        try {
            const response = await fetch(this.OVERPASS_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `data=${encodeURIComponent(overpassQuery)}`,
            });

            if (!response.ok) {
                throw new Error(`Overpass API error: ${response.status}`);
            }

            const data = await response.json();
            const places: OverpassPlace[] = (data.elements || []).filter((el: OverpassPlace) => el.tags?.name);

            return places.slice(0, 10).map((place) => {
                const placeLoc: LatLng = { lat: place.lat, lng: place.lon };
                const distance = this.calculateDistance(location, placeLoc) / 1000;

                return {
                    id: place.id.toString(),
                    name: place.tags.name || 'Unknown',
                    type: this.getPlaceType(place),
                    address: this.buildAddress(place),
                    coordinates: placeLoc,
                    distanceFromYou: Math.round(distance * 10) / 10,
                    whyRecommended: '',
                    openingHours: place.tags.opening_hours,
                    googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lon}`,
                };
            });
        } catch (error) {
            this.logger.error('Failed to search places:', error);
            return [];
        }
    }

    private getPlaceType(place: OverpassPlace): DateSpot['type'] {
        if (place.tags.amenity === 'cafe') return 'cafe';
        if (place.tags.amenity === 'restaurant') return 'restaurant';
        if (place.tags.amenity === 'bar' || place.tags.amenity === 'pub') return 'bar';
        if (place.tags.leisure === 'park' || place.tags.leisure === 'garden') return 'park';
        return 'other';
    }

    private buildAddress(place: OverpassPlace): string {
        const parts = [
            place.tags['addr:housenumber'],
            place.tags['addr:street'],
            place.tags['addr:city'],
        ].filter(Boolean);
        return parts.length > 0 ? parts.join(', ') : 'Địa chỉ không rõ';
    }
}
