import { PrismaClient as PrismaClientV1 } from "@generated/prisma-v1/index.js";
import { PrismaClient as PrismaClientV2 } from "@generated/prisma-v2/index.js";
import { Banner } from "@maps/banners/Banner.js";

const prismaV1 = new PrismaClientV1();
const prismaV2 = new PrismaClientV2();

export async function migrate(): Promise<void> {

}

async function migrateBanner(banner: Banner): Promise<void> {
    console.log(`migrate banner: ${banner.name} (${banner.id})`);

    const bannerId = banner.id;
    const startTime = banner.getMinStartTime();
    const endTime = banner.getMaxEndTime();
}

async function getTimeline(bannerId: string) {}