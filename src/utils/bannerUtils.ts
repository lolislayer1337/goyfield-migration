import { Banner } from "@maps/banners/Banner.js";

export function getBannerId(banner: Banner): string {
    if (banner.id === "standard") {
        return "standard_01";
    }

    return banner.id;
}

export function normalizeBannerId(bannerId: string): string {
    if (bannerId === "standard_01") {
        return "standard";
    }

    return bannerId;
}