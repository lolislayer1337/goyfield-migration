import { PrismaClient as PrismaClientV1 } from "@generated/prisma-v1/index.js";
import { PrismaClient as PrismaClientV2 } from "@generated/prisma-v2/index.js";
import { Banner } from "@maps/banners/Banner.js";
import { bannerList, bannerTypeMap } from "@maps/instances.js";
import { ItemStatRecord } from "@scripts/v2/db/records/ItemStatRecord.js";
import { PityDistributionRecord } from "@scripts/v2/db/records/PityDistributionRecord.js";
import { TimelineRecord } from "@scripts/v2/db/records/TimelineRecord.js";
import { SchemaV1 } from "@scripts/v2/db/schemas/SchemaV1.js";
import { SchemaV2 } from "@scripts/v2/db/schemas/SchemaV2.js";
import { redistributeCounts } from "@utils/collectionUtils.js";
import { isDateInRange } from "@utils/dateUtils.js";

const prismaV1 = new PrismaClientV1();
const prismaV2 = new PrismaClientV2();

const schemaV1 = new SchemaV1(prismaV1);
const schemaV2 = new SchemaV2(prismaV2);

export async function migrate(): Promise<void> {
    for (const banner of bannerList) {
        await migrateGlobalBanner(banner);
    }
}

async function migrateGlobalBanner(banner: Banner): Promise<void> {
    console.log(`[GLOBAL] migrate banner: ${banner.name} (${banner.id})`);

    const timeline = await getTimeline(banner);
    const itemStats = await getItemStats(banner);
    const pityDistribution = await getPityDistribution(banner);

    const itemStatsSum6 = itemStats.records
        .filter(item => item.rarity === 6)
        .reduce((sum, item) => sum + item.count, 0);
    const pityDistributionSum6 = pityDistribution.records
        .filter(item => item.rarity === 6)
        .reduce((sum, item) => sum + item.count, 0);

    let itemStats6 = itemStats.records.filter(item => item.rarity === 6).map(item => item.getV2());
    let itemStats5 = itemStats.records.filter(item => item.rarity === 5).map(item => item.getV2());
    let itemStats4 = itemStats.records.filter(item => item.rarity === 4).map(item => item.getV2());

    let pityDistribution6 = pityDistribution.records.map(r => r.getV2());

    let targetSum6: number;

    if (itemStatsSum6 === pityDistributionSum6) {
        targetSum6 = itemStatsSum6;
    } else if (itemStatsSum6 < pityDistributionSum6) {
        targetSum6 = itemStatsSum6;

        pityDistribution6 = redistributeCounts(pityDistribution6, targetSum6, "count");
    } else {
        targetSum6 = pityDistributionSum6;

        itemStats6 = redistributeCounts(itemStats6, targetSum6, "count");
    }

    const targetTotalCount = timeline.records.reduce((sum, item) => sum + item.pulls, 0);
    const targetSum5 = itemStats5.reduce((sum, item) => sum + item.count, 0);
    const targetSum4 = targetTotalCount - targetSum6 - targetSum5;

    itemStats4 = redistributeCounts(itemStats4, targetSum4, "count");

    const newTimeline = timeline.records.map(r => r.getV2());
    const newItemStats = [
        ...itemStats6,
        ...itemStats5,
        ...itemStats4
    ];
    const newPityDistribution = pityDistribution6;

    await schemaV2.createManyTimeline(newTimeline);
    await schemaV2.createManyItemStats(newItemStats);
    await schemaV2.createManyPityDistribution(newPityDistribution);
}

async function getPityDistribution(banner: Banner): Promise<{
    records: PityDistributionRecord[];
    illegalPullsCount: number
}> {
    const bannerId = getBannerId(banner);
    const bannerTypeInfo = bannerTypeMap.get(banner.type)!;
    const minPulls = 0;
    const maxPulls = bannerTypeInfo.pullsLimit;
    const maxPulls6 = bannerTypeInfo.softGuarantee;
    const maxPulls5 = bannerTypeInfo.softGuarantee5;
    const maxPulls4 = 1;

    const resultDistribution: PityDistributionRecord[] = [];
    let illegalPullsCount = 0;

    const pityDistribution = await schemaV1.getPityDistribution(bannerId);

    for (const item of pityDistribution) {
        const pity = item.pity;
        const rarity = item.rarity;

        if (rarity !== 6 && rarity !== 5 && rarity !== 4) {
            console.log(`[GLOBAL] [PityDistribution] Illegal pull found: ${item.bannerId} ${item.pity} ${item.rarity} (${item.count})`);

            illegalPullsCount += item.count;

            continue;
        }

        const softGuarantee =
            rarity === 6 ? maxPulls6
            : rarity === 5 ? maxPulls5
            : maxPulls4;

        if (pity < minPulls || maxPulls !== 0 && pity > maxPulls || softGuarantee !== 0 && pity > softGuarantee) {
            console.log(`[GLOBAL] [PityDistribution] Illegal pull found: ${item.bannerId} ${item.pity} ${item.rarity} (${item.count})`);

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
    totalIllegalItemCount: number;
    illegalItemCount6: number;
    illegalItemCount5: number
}> {
    const bannerId = getBannerId(banner);

    const resultStats: ItemStatRecord[] = [];
    let totalIllegalItemCount = 0;
    let illegalItemCount6 = 0;
    let illegalItemCount5 = 0;

    const stats = await schemaV1.getItemStats(bannerId);

    for (const item of stats) {
        const itemId = item.itemId;

        const isValid = banner.isAllowed(itemId, item.rarity);

        if (!isValid) {
            console.log(`[GLOBAL] [ItemStats] Invalid item found: ${itemId} ${item.rarity} (${item.count}) for ${bannerId}`);

            totalIllegalItemCount += item.count;

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
        totalIllegalItemCount,
        illegalItemCount6,
        illegalItemCount5
    };
}

async function getTimeline(banner: Banner): Promise<{ records: TimelineRecord[]; illegalPullsCount: number }> {
    const bannerId = getBannerId(banner);
    const startTime = banner.getMinStartTime();
    const endTime = banner.getMaxEndTime();

    const resultTimeline: TimelineRecord[] = [];
    let illegalPullsCount = 0;

    const timeline = await schemaV1.getTimeline(bannerId);

    for (const item of timeline) {
        const date = item.getDate();
        const isValid = isDateInRange(date, startTime, endTime);

        if (!isValid) {
            console.log(`[GLOBAL] [Timeline] Invalid date found: ${item.date} (${item.pulls}) for ${bannerId}`);

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

function getBannerId(banner: Banner) {
    if (banner.id === "standard") {
        return "standard_01";
    }

    return banner.id;
}