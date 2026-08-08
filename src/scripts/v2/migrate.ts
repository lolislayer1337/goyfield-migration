import { PrismaClient as PrismaClientV1 } from "@generated/prisma-v1/index.js";
import { PrismaClient as PrismaClientV2 } from "@generated/prisma-v2/index.js";
import { Banner } from "@maps/banners/Banner.js";
import { bannerTypeMap } from "@maps/instances.js";
import { ItemStatRecord } from "@scripts/v2/db/records/ItemStatRecord.js";
import { PityDistributionRecord } from "@scripts/v2/db/records/PityDistributionRecord.js";
import { TimelineRecord } from "@scripts/v2/db/records/TimelineRecord.js";
import { SchemaV1 } from "@scripts/v2/db/schemas/SchemaV1.js";
import { SchemaV2 } from "@scripts/v2/db/schemas/SchemaV2.js";
import { isDateInRange } from "@utils/dateUtils.js";

const prismaV1 = new PrismaClientV1();
const prismaV2 = new PrismaClientV2();

const schemaV1 = new SchemaV1(prismaV1);
const schemaV2 = new SchemaV2(prismaV2);

export async function migrate(): Promise<void> {

}

async function migrateGlobalBanner(banner: Banner): Promise<void> {
    console.log(`migrate banner: ${banner.name} (${banner.id})`);

    const timeline = await getTimeline(banner);
    const itemStats = await getItemStats(banner);
    const pityDistribution = await getPityDistribution(banner);
}

async function getPityDistribution(banner: Banner): Promise<{
    records: PityDistributionRecord[];
    illegalPullsCount: number
}> {
    const bannerTypeInfo = bannerTypeMap.get(banner.type)!;
    const minPulls = 0;
    const maxPulls = bannerTypeInfo.pullsLimit;
    const maxPulls6 = bannerTypeInfo.softGuarantee;
    const maxPulls5 = bannerTypeInfo.softGuarantee5;
    const maxPulls4 = 1;

    const resultDistribution: PityDistributionRecord[] = [];
    let illegalPullsCount = 0;

    const pityDistribution = await schemaV1.getPityDistribution(banner.id);

    for (const item of pityDistribution) {
        const pity = item.pity;
        const rarity = item.rarity;

        if (rarity !== 6 && rarity !== 5 && rarity !== 4) {
            console.log(`Illegal pull found: ${item.bannerId} ${item.pity} ${item.rarity}`);

            illegalPullsCount += item.count;

            continue;
        }

        const softGuarantee =
            rarity === 6 ? maxPulls6
            : rarity === 5 ? maxPulls5
            : maxPulls4;

        if (pity < minPulls || maxPulls !== 0 && pity > maxPulls || softGuarantee !== 0 && pity > softGuarantee) {
            console.log(`Illegal pull found: ${item.bannerId} ${item.pity} ${item.rarity}`);

            illegalPullsCount = item.count;

            continue;
        }

        resultDistribution.push(item);
    }

    return {
        records: resultDistribution,
        illegalPullsCount
    };
}

async function getItemStats(banner: Banner): Promise<{
    records: ItemStatRecord[];
    illegalItemCount6: number;
    illegalItemCount5: number
}> {
    const resultStats: ItemStatRecord[] = [];
    let illegalItemCount6 = 0;
    let illegalItemCount5 = 0;

    const stats = await schemaV1.getItemStats(banner.id);

    for (const item of stats) {
        const itemId = item.itemId;

        const isValid = banner.isAllowed(itemId, item.rarity);

        if (!isValid) {
            console.log(`Invalid item found: ${itemId} ${item.rarity} for ${banner.id}`);

            if (item.rarity === 6) {
                illegalItemCount6 += item.count;
            } else if (item.rarity === 5) {
                illegalItemCount5 += item.count;
            }

            continue;
        }

        resultStats.push(item);
    }

    return {
        records: resultStats,
        illegalItemCount6,
        illegalItemCount5
    };
}

async function getTimeline(banner: Banner): Promise<{ records: TimelineRecord[]; illegalPullsCount: number }> {
    const startTime = banner.getMinStartTime();
    const endTime = banner.getMaxEndTime();

    const resultTimeline: TimelineRecord[] = [];
    let illegalPullsCount = 0;

    const timeline = await schemaV1.getTimeline(banner.id);

    for (const item of timeline) {
        const date = item.getDate();
        const isValid = isDateInRange(date, startTime, endTime);

        if (!isValid) {
            console.log(`Invalid date found: ${item.date} for ${banner.id}`);

            illegalPullsCount += item.pulls;

            continue;
        }

        resultTimeline.push(item);
    }


    return {
        records: resultTimeline,
        illegalPullsCount
    };
}