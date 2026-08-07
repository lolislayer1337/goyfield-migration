import { ItemStatEntity } from "@scripts/v2/db/entities/ItemStatEntity.js";

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

    public get bannerId(): string {
        return this._bannerId;
    }

    public get itemName(): string {
        return this._itemName;
    }

    public get rarity(): number {
        return this._rarity;
    }

    public get count(): number {
        return this._count;
    }
}