import { Banner } from "@maps/banners/Banner.js";
import { BannerTypeEntity } from "@maps/bannerTypes/BannerTypeEntity.js";
import { NameMap } from "@maps/nameMap/NameMap.js";
import banners from "@static/banners.json" with { type: "json" };
import bannerTypes from "@static/bannerTypes.json" with { type: "json" };
import charNames from "@static/charNames.json" with { type: "json" };
import weaponNames from "@static/weaponNames.json" with { type: "json" };
import { getMap } from "@utils/collectionUtils.js";

export const bannerList: Banner[] = banners.map(banner => new Banner(banner));
export const bannerMap: Map<string, Banner> = getMap(banners.map(banner => new Banner(banner)), banner => banner.id);

export const bannerTypeMap: Map<string, BannerTypeEntity> = getMap(bannerTypes, item => item.type);

export const charNameMap = new NameMap(charNames);
export const weaponNameMap = new NameMap(weaponNames);