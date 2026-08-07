import { PityDistributionEntity } from "@scripts/v2/db/entities/PityDistributionEntity.js";

export class PityDistributionRecord {
    private readonly _bannerId: string;
    private readonly _pity: number;
    private readonly _rarity: number;
    private readonly _count: number;

    public constructor(entity: PityDistributionEntity) {
        this._bannerId = entity.bannerId;
        this._pity = entity.pity;
        this._rarity = entity.rarity;
        this._count = entity.count;
    }

    public get bannerId(): string {
        return this._bannerId;
    }

    public get pity(): number {
        return this._pity;
    }

    public get rarity(): number {
        return this._rarity;
    }

    public get count(): number {
        return this._count;
    }
}