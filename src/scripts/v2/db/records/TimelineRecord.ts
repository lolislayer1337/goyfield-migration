import { TimelineEntity } from "@scripts/v2/db/entitiesV1/TimelineEntity.js";
import { GlobalBannerTimelineEntity } from "@scripts/v2/db/entitiesV2/GlobalBannerTimelineEntity.js";
import { normalizeBannerId } from "@utils/bannerUtils.js";

export class TimelineRecord {
    private readonly _bannerId: string;
    private readonly _date: string;
    private readonly _pulls: number;

    public constructor(entity: TimelineEntity) {
        this._bannerId = entity.bannerId;
        this._date = entity.date;
        this._pulls = entity.pulls;
    }

    public get bannerId(): string {
        return normalizeBannerId(this._bannerId);
    }

    public get date(): string {
        return this._date;
    }

    public get pulls(): number {
        return this._pulls;
    }

    public getDate(): Date {
        return new Date(this._date + "T00:00:00Z");
    }

    public getV2(): GlobalBannerTimelineEntity {
        return {
            bannerId: this.bannerId,
            date: this._date,
            totalPullsCount: this._pulls,
            freePullsCount: 0
        }
    }
}