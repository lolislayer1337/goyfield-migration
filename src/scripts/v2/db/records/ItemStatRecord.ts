import { logger } from "@/logger.js";
import { charNameMap, weaponNameMap } from "@maps/instances.js";
import { ItemStatEntity } from "@scripts/v2/db/entitiesV1/ItemStatEntity.js";
import { GlobalItemStatsEntity } from "@scripts/v2/db/entitiesV2/GlobalItemStatsEntity.js";
import { normalizeBannerId } from "@utils/bannerUtils.js";

export class ItemStatRecord {
    private readonly _bannerId: string;
    private readonly _itemName: string;
    private readonly _rarity: number;
    private readonly _count: number;

    public constructor(entity: ItemStatEntity) {
        this._bannerId = entity.bannerId;
        this._itemName = entity.itemName;
        this._rarity = entity.rarity;
        this._count = entity.count;
    }

    private static getItemId(itemName: string): string | null {
        const id = charNameMap.getIdByName(itemName)
            ?? weaponNameMap.getIdByName(itemName);

        if (id === null) {
            logger.warn(`Item name not found: '${itemName}'`);
        }

        return id;
    }

    public get bannerId(): string {
        return normalizeBannerId(this._bannerId);
    }

    public get itemName(): string {
        return this._itemName;
    }

    public get itemId(): string | null {
        return ItemStatRecord.getItemId(this._itemName)
    }

    public get rarity(): number {
        return this._rarity;
    }

    public get count(): number {
        return this._count;
    }

    public getV2(): GlobalItemStatsEntity {
        return {
            bannerId: this.bannerId,
            itemId: this.itemId!,
            rarity: this._rarity,
            count: this._count,
        };
    }
}