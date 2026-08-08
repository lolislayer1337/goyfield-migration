import { PrismaClient as PrismaClientV1 } from "@generated/prisma-v1/index.js";
import { PrismaClient as PrismaClientV2 } from "@generated/prisma-v2/index.js";
import { Banner } from "@maps/banners/Banner.js";
import { bannerList, bannerMap, bannerTypeMap } from "@maps/instances.js";
import { UserBannerStatEntity as UserBannerStatEntityV1 } from "@scripts/v2/db/entitiesV1/UserBannerStatEntity.js";
import { UserBannerProfileEntity } from "@scripts/v2/db/entitiesV2/UserBannerProfileEntity.js";
import { UserBannerStatEntity as UserBannerStatEntityV2 } from "@scripts/v2/db/entitiesV2/UserBannerStatEntity.js";
import { UserCharBannerPullsEntity } from "@scripts/v2/db/entitiesV2/UserCharBannerPullsEntity.js";
import { UserCharBannerTypePullsEntity } from "@scripts/v2/db/entitiesV2/UserCharBannerTypePullsEntity.js";
import { UserWeaponBannerPullsEntity } from "@scripts/v2/db/entitiesV2/UserWeaponBannerPullsEntity.js";
import { ItemStatRecord } from "@scripts/v2/db/records/ItemStatRecord.js";
import { PityDistributionRecord } from "@scripts/v2/db/records/PityDistributionRecord.js";
import { TimelineRecord } from "@scripts/v2/db/records/TimelineRecord.js";
import { UserBannerStatRecord } from "@scripts/v2/db/records/UserBannerStatRecord.js";
import { SchemaV1 } from "@scripts/v2/db/schemas/SchemaV1.js";
import { SchemaV2 } from "@scripts/v2/db/schemas/SchemaV2.js";
import { getBannerId, normalizeBannerId } from "@utils/bannerUtils.js";
import { getListMap, redistributeCounts } from "@utils/collectionUtils.js";
import { isDateInRange } from "@utils/dateUtils.js";

const prismaV1 = new PrismaClientV1();
const prismaV2 = new PrismaClientV2();

const schemaV1 = new SchemaV1(prismaV1);
const schemaV2 = new SchemaV2(prismaV2);

export async function migrate(): Promise<void> {
    for (const banner of bannerList) {
        await migrateGlobalBanner(banner);
    }

    await migrateUserBannerProfiles();
}

async function migrateUserBannerProfiles(): Promise<void> {
    const usersInfo = await schemaV1.countUsers();
    console.log(`[USER] Migration for ${usersInfo.count} users (${usersInfo.pages} pages)`);

    for (let i = 1; i <= usersInfo.pages; i++) {
        console.log(`[USER] Page ${i} of ${usersInfo.pages}`);

        const privateIds = await schemaV1.getUserIds(i);
        const oldStats = await schemaV1.getManyUserBannerStats(privateIds);
        const oldStatsMapped = getListMap(oldStats, e => e.uid);

        const profiles = await schemaV2.createManyUserBannerProfiles(privateIds);

        const stats: UserBannerStatEntityV2[] = [];
        const charTypePulls: UserCharBannerTypePullsEntity[] = [];
        const charPulls: UserCharBannerPullsEntity[] = [];
        const weaponPulls: UserWeaponBannerPullsEntity[] = [];

        for (const profile of profiles) {
            const statsList = oldStatsMapped.get(profile.privateId);

            if (!statsList) {
                continue;
            }

            const userStats = getUserBannerStats(profile, statsList);

            stats.push(...userStats.stats);
            charTypePulls.push(...userStats.charTypePulls);
            charPulls.push(...userStats.charPulls);
            weaponPulls.push(...userStats.weaponPulls);
        }

        try {
            await schemaV2.createManyUserBannerStats(stats);
        } catch (e) {
            console.log(stats.length);
            throw e;
        }
        await schemaV2.createManyUserCharBannerTypePulls(charTypePulls);
        await schemaV2.createManyUserCharBannerPulls(charPulls);
        await schemaV2.createManyUserWeaponBannerPulls(weaponPulls);
    }
}

function getUserBannerStats(profile: UserBannerProfileEntity, oldStats: UserBannerStatEntityV1[]): {
    stats: UserBannerStatEntityV2[];
    charTypePulls: UserCharBannerTypePullsEntity[];
    charPulls: UserCharBannerPullsEntity[];
    weaponPulls: UserWeaponBannerPullsEntity[]
} {
    const stats: UserBannerStatEntityV2[] = [];
    const charTypePulls: UserCharBannerTypePullsEntity[] = [];
    const charPulls: UserCharBannerPullsEntity[] = [];
    const weaponPulls: UserWeaponBannerPullsEntity[] = [];

    const lastPullTimeByBannerType = new Map<string, bigint>();

    for (const entity of oldStats) {
        if (entity.bannerId === "standard") {
            continue;
        }

        const bannerId = normalizeBannerId(entity.bannerId);
        const banner = bannerMap.get(bannerId);

        if (!banner) {
            continue;
        }

        const isWeapon = banner.type === "weapon";

        const record = UserBannerStatRecord.createFromV1(profile.profileId, banner.dbType, entity);

        stats.push(record.getV2());

        if (isWeapon) {
            weaponPulls.push({
                profileId: profile.profileId,
                bannerId,
                last6Pull: record.unfreePulls,
                last5Pull: record.unfreePulls,
                lastWin5050Pull: record.unfreePulls,
                lastPullTimeTs: entity.lastProcessedPullTime
            });
        } else {
            const currentLastPullTime = lastPullTimeByBannerType.get(banner.dbType) ?? 0n;
            if (currentLastPullTime < entity.lastProcessedPullTime) {
                lastPullTimeByBannerType.set(banner.dbType, entity.lastProcessedPullTime);
            }

            charPulls.push({
                profileId: profile.profileId,
                bannerId,
                last6LimitedPull: record.unfreePulls,
            });
        }
    }

    const statsMappedByBannerType = getListMap(stats, e => e.bannerType);

    for (const [bannerType, entities] of statsMappedByBannerType) {
        if (bannerType.startsWith("weap")) {
            continue;
        }

        const unfreePullsCount = entities.reduce((sum, e) => sum + e.unfreePulls, 0);
        const lastPullTime = lastPullTimeByBannerType.get(bannerType)!;

        charTypePulls.push({
            profileId: profile.profileId,
            bannerType: bannerType,
            last6Pull: unfreePullsCount,
            last5Pull: unfreePullsCount,
            lastWin5050Pull: unfreePullsCount,
            lastPullTimeTs: lastPullTime
        });
    }

    return {
        stats,
        charTypePulls,
        charPulls,
        weaponPulls
    };
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

