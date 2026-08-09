import { UserBannerStatEntity } from "@scripts/v2/db/entitiesV1/UserBannerStatEntity.js";
import { UserBannerStatEntity as UserBannerStatEntityV2 } from "@scripts/v2/db/entitiesV2/UserBannerStatEntity.js";
import { normalizeBannerId } from "@utils/bannerUtils.js";

export class UserBannerStatRecord {
    private readonly _profileId: bigint;
    private readonly _bannerId: string;
    private readonly _bannerType: string;
    private readonly _unfreePulls: number;
    private readonly _total6: number;
    private readonly _total5: number;
    private readonly _won5050: number;
    private readonly _total5050: number;
    private readonly _freePulls: number;
    private readonly _free6: number;
    private readonly _free5: number;
    private readonly _freeWin5050: number;

    private constructor(uid: bigint, bannerId: string, bannerType: string, unfreePulls: number, total6: number, total5: number, won5050: number, total5050: number, freePulls: number, free6: number, free5: number, freeWin5050: number) {
        this._profileId = uid;
        this._bannerId = bannerId;
        this._bannerType = bannerType;
        this._unfreePulls = unfreePulls;
        this._total6 = total6;
        this._total5 = total5;
        this._won5050 = won5050;
        this._total5050 = total5050;
        this._freePulls = freePulls;
        this._free6 = free6;
        this._free5 = free5;
        this._freeWin5050 = freeWin5050;
    }

    public static createFromV1(uid: bigint, bannerType: string, entity: UserBannerStatEntity): UserBannerStatRecord {
        return new UserBannerStatRecord(
            uid,
            entity.bannerId,
            bannerType,
            this.getTotalPulls(bannerType, entity.totalPulls),
            entity.total6,
            entity.total5,
            entity.won5050,
            entity.total5050,
            entity.totalPulls >= 40 && bannerType === "special" ? 10 : 0,
            0,
            entity.totalPulls >= 40 && bannerType === "special" ? 1 : 0,
            0
        );
    }

    private static getTotalPulls(bannerType: string, totalPulls: number): number {
        let result = totalPulls;

        if (bannerType === "special" && totalPulls >= 40) {
            result -= 10;
        }

        if (bannerType.startsWith("weap")) {
            result -= result % 10;
        }

        return result;
    }

    public get profileId(): bigint {
        return this._profileId;
    }

    public get bannerId(): string {
        return normalizeBannerId(this._bannerId);
    }

    public get bannerType(): string {
        return this._bannerType;
    }

    public get unfreePulls(): number {
        return this._unfreePulls;
    }

    public get total6(): number {
        return this._total6;
    }

    public get total5(): number {
        return this._total5;
    }

    public get won5050(): number {
        return this._won5050;
    }

    public get total5050(): number {
        return this._total5050;
    }

    public get freePulls(): number {
        return this._freePulls;
    }

    public get free6(): number {
        return this._free6;
    }

    public get free5(): number {
        return this._free5;
    }

    public get freeWin5050(): number {
        return this._freeWin5050;
    }

    public getV2(): UserBannerStatEntityV2 {
        return {
            profileId: this._profileId,
            bannerId: this.bannerId,
            bannerType: this._bannerType,
            unfreePulls: this.unfreePulls,
            total6: this.total6,
            total5: this.total5,
            total5050: this.total5050,
            won5050: this.won5050,
            freePulls: this.freePulls,
            free6: this.free6,
            free5: this.free5,
            freeWin5050: this.freeWin5050
        };
    }
}