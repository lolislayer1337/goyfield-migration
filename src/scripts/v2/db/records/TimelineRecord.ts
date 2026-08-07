import { TimelineEntity } from "@scripts/v2/db/entities/TimelineEntity.js";

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
        return this._bannerId;
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
}