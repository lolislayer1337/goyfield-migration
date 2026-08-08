import { PityDistributionEntity } from "@scripts/v2/db/entitiesV1/PityDistributionEntity.js";
import { GlobalPityDistributionEntity } from "@scripts/v2/db/entitiesV2/GlobalPityDistributionEntity.js";

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

    public getV2(): GlobalPityDistributionEntity {
        return {
            bannerId: this._bannerId,
            rarity: this._rarity,
            pity: this._pity,
            count: this._count
        };
    }
}