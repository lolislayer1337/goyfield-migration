import { PrismaClient } from "@generated/prisma-v2/index.js";
import { GlobalBannerTimelineEntity } from "@scripts/v2/db/entitiesV2/GlobalBannerTimelineEntity.js";
import { GlobalItemStatsEntity } from "@scripts/v2/db/entitiesV2/GlobalItemStatsEntity.js";
import { GlobalPityDistributionEntity } from "@scripts/v2/db/entitiesV2/GlobalPityDistributionEntity.js";
import { UserBannerProfileEntity } from "@scripts/v2/db/entitiesV2/UserBannerProfileEntity.js";
import { UserBannerStatEntity } from "@scripts/v2/db/entitiesV2/UserBannerStatEntity.js";
import { UserCharBannerPullsEntity } from "@scripts/v2/db/entitiesV2/UserCharBannerPullsEntity.js";
import { UserCharBannerTypePullsEntity } from "@scripts/v2/db/entitiesV2/UserCharBannerTypePullsEntity.js";
import { UserWeaponBannerPullsEntity } from "@scripts/v2/db/entitiesV2/UserWeaponBannerPullsEntity.js";

export class SchemaV2 {
    private readonly _prisma: PrismaClient;

    public constructor(prisma: PrismaClient) {
        this._prisma = prisma;
    }

    public async createManyTimeline(entities: GlobalBannerTimelineEntity[]) {
        await this._prisma.globalBannerTimeline.createMany({
            data: entities
        });
    }

    public async createManyItemStats(entities: GlobalItemStatsEntity[]) {
        for (const item of entities) {
            await this._prisma.globalItemStats.upsert({
                where: {
                    bannerId_itemId: {
                        bannerId: item.bannerId,
                        itemId: item.itemId
                    }
                },
                update: {
                    count: {increment: item.count}
                },
                create: {
                    bannerId: item.bannerId,
                    itemId: item.itemId,
                    rarity: item.rarity,
                    count: item.count
                }
            });
        }
    }

    public async createManyPityDistribution(entities: GlobalPityDistributionEntity[]) {
        await this._prisma.globalPityDistribution.createMany({
            data: entities
        });
    }

    public async createManyUserBannerProfiles(privateIds: string[]): Promise<UserBannerProfileEntity[]> {
        return await this._prisma.userBannerProfile.createManyAndReturn({
            data: privateIds.map(privateId => ({ privateId, version: 1 }))
        });
    }

    public async createManyUserBannerStats(entities: UserBannerStatEntity[]): Promise<void> {
        await this._prisma.userBannerStat.createMany({
            data: entities
        });
    }

    public async createManyUserCharBannerTypePulls(entities: UserCharBannerTypePullsEntity[]) {
        await this._prisma.userCharBannerTypePulls.createMany({
            data: entities
        });
    }

    public async createManyUserCharBannerPulls(entities: UserCharBannerPullsEntity[]) {
        await this._prisma.userCharBannerPulls.createMany({
            data: entities
        });
    }

    public async createManyUserWeaponBannerPulls(entities: UserWeaponBannerPullsEntity[]) {
        await this._prisma.userWeaponBannerPulls.createMany({
            data: entities
        });
    }
}