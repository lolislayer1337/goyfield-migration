import { PrismaClient } from "@generated/prisma-v1/index.js";
import { ItemStatRecord } from "@scripts/v2/db/records/ItemStatRecord.js";
import { PityDistributionRecord } from "@scripts/v2/db/records/PityDistributionRecord.js";
import { TimelineRecord } from "@scripts/v2/db/records/TimelineRecord.js";

export class SchemaV1 {
    private readonly _prisma: PrismaClient;

    public constructor(prisma: PrismaClient) {
        this._prisma = prisma;
    }

    public async getTimeline(bannerId: string): Promise<TimelineRecord[]> {
        const entities = await this._prisma.globalTimeline.findMany({
            where: {
                bannerId
            },
            orderBy: {
                date: "asc"
            }
        });

        return entities.map(e => new TimelineRecord(e));
    }

    public async getItemStats(bannerId: string): Promise<ItemStatRecord[]> {
        const entities = await this._prisma.globalItemStats.findMany({
            where: {
                bannerId
            },
            orderBy: {
                rarity: "desc"
            }
        });

        return entities.map(e => new ItemStatRecord(e));
    }

    public async getPityDistribution(bannerId: string): Promise<PityDistributionRecord[]> {
        const entities = await this._prisma.globalPityDistribution.findMany({
            where: {
                bannerId
            },
            orderBy: [
                {
                    rarity: "desc"
                },
                {
                    pity: "asc"
                }
            ]
        });

        return entities.map(e => new PityDistributionRecord(e));
    }
}