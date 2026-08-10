import { PrismaClient } from "@generated/prisma-v2/index.js";
import { BannerItemStat } from "@scripts/v2/db/entitiesV2/BannerItemStat.js";
import { GlobalBannerStats } from "@scripts/v2/db/entitiesV2/GlobalBannerStats.js";
import { GlobalBannerTimelineEntity } from "@scripts/v2/db/entitiesV2/GlobalBannerTimelineEntity.js";
import { GlobalItemStatsEntity } from "@scripts/v2/db/entitiesV2/GlobalItemStatsEntity.js";
import { GlobalPityDistributionEntity } from "@scripts/v2/db/entitiesV2/GlobalPityDistributionEntity.js";
import { TimelineStat } from "@scripts/v2/db/entitiesV2/TimelineStat.js";
import { UserBannerProfileEntity } from "@scripts/v2/db/entitiesV2/UserBannerProfileEntity.js";
import { UserBannerStatEntity } from "@scripts/v2/db/entitiesV2/UserBannerStatEntity.js";
import { UserCharBannerPullsEntity } from "@scripts/v2/db/entitiesV2/UserCharBannerPullsEntity.js";
import { UserCharBannerTypePullsEntity } from "@scripts/v2/db/entitiesV2/UserCharBannerTypePullsEntity.js";
import { UserWeaponBannerPullsEntity } from "@scripts/v2/db/entitiesV2/UserWeaponBannerPullsEntity.js";
import { getMap } from "@utils/collectionUtils.js";
import { randomUUID } from "node:crypto";

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

    public async getGlobalBannerStats(bannerId: string): Promise<GlobalBannerStats> {
        const entity = await this._prisma.userBannerStat.aggregate({
            where: {
                bannerId
            },
            _sum: {
                unfreePulls: true,
                freePulls: true,
                total6: true,
                total5: true,
                total5050: true,
                won5050: true
            },
        });

        return {
            bannerId,
            totalPulls: (entity._sum.unfreePulls ?? 0) + (entity._sum.freePulls ?? 0),
            total6: entity._sum.total6 ?? 0,
            total5: entity._sum.total5 ?? 0,
            total5050: entity._sum.total5050 ?? 0,
            won5050: entity._sum.won5050 ?? 0,
        };
    }

    public async createSpecialBannerProfile(): Promise<UserBannerProfileEntity> {
        const uuid = randomUUID();
        const id = `special_banner_profile-${uuid}`;

        return await this._prisma.userBannerProfile.create({
            data: {
                version: 2,
                publicId: id
            }
        });
    }

    public async getTimelineStat(bannerId: string): Promise<TimelineStat> {
        const entity = await this._prisma.globalBannerTimeline.aggregate({
            where: {
                bannerId
            },
            _sum: {
                totalPullsCount: true,
                freePullsCount: true
            }
        });

        return {
            bannerId,
            totalPulls: entity._sum.totalPullsCount ?? 0,
            freePulls: entity._sum.freePullsCount ?? 0
        };
    }

    public async getBannerItemStat(bannerId: string): Promise<BannerItemStat> {
        const entities = await this._prisma.globalItemStats.groupBy({
            where: {
                bannerId
            },
            by: "rarity",
            _sum: {
                count: true
            }
        });

        const map = getMap(entities, e => e.rarity);

        return {
            bannerId,
            total6: map.get(6)?._sum.count ?? 0,
            total5: map.get(5)?._sum.count ?? 0,
            total4: map.get(4)?._sum.count ?? 0
        };
    }
}