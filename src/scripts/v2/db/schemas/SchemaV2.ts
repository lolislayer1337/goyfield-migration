import { PrismaClient } from "@generated/prisma-v2/index.js";
import { GlobalBannerTimelineEntity } from "@scripts/v2/db/entitiesV2/GlobalBannerTimelineEntity.js";
import { GlobalItemStatsEntity } from "@scripts/v2/db/entitiesV2/GlobalItemStatsEntity.js";
import { GlobalPityDistributionEntity } from "@scripts/v2/db/entitiesV2/GlobalPityDistributionEntity.js";
import { ItemStatRecord } from "@scripts/v2/db/records/ItemStatRecord.js";
import { PityDistributionRecord } from "@scripts/v2/db/records/PityDistributionRecord.js";
import { TimelineRecord } from "@scripts/v2/db/records/TimelineRecord.js";

export class SchemaV2 {
    private readonly _prisma: PrismaClient;

    public constructor(prisma: PrismaClient) {
        this._prisma = prisma;
    }

    public async createManyTimelineRecords(records: TimelineRecord[]) {
        return this.createManyTimeline(records.map(r => r.getV2()));
    }

    public async createManyTimeline(entities: GlobalBannerTimelineEntity[]) {
        await this._prisma.globalBannerTimeline.createMany({
            data: entities
        });
    }

    public async createManyItemStatsRecords(records: ItemStatRecord[]) {
        return this.createManyItemStats(records.map(r => r.getV2()));
    }

    public async createManyItemStats(entities: GlobalItemStatsEntity[]) {
        // await this._prisma.globalItemStats.createMany({
        //     data: entities
        // });

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

    public async createManyPityDistributionRecords(records: PityDistributionRecord[]) {
        return this.createManyPityDistribution(records.map(r => r.getV2()));
    }

    public async createManyPityDistribution(entities: GlobalPityDistributionEntity[]) {
        await this._prisma.globalPityDistribution.createMany({
            data: entities
        });
    }
}