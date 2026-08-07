import { BannerEntity } from "@maps/banners/BannerEntity.js";

export class Banner {
    private readonly _id: string;
    private readonly _name: string;
    private readonly _type: string;
    private readonly _dbType: string;
    private readonly _startTime: Date;
    private readonly _endTime: Date | null;
    private readonly _startTimeAsia: Date;
    private readonly _endTimeAsia: Date | null;

    public constructor(entity: BannerEntity) {
        this._id = entity.id;
        this._name = entity.name;
        this._type = entity.type;
        this._dbType = entity.dbType;
        this._startTime = Banner.getDate(entity.startTime);
        this._endTime = entity.endTime ? Banner.getDate(entity.endTime) : null;
        this._startTimeAsia = Banner.getDate(entity.startTimeAsia);
        this._endTimeAsia = entity.endTimeAsia ? Banner.getDate(entity.endTimeAsia) : null;
    }

    private static getDate(str: string): Date {
        const dateStr = str.replace(" ", "T") + "Z";

        return new Date(dateStr);
    }

    public get id(): string {
        return this._id;
    }

    public get name(): string {
        return this._name;
    }

    public get type(): string {
        return this._type;
    }

    public get dbType(): string {
        return this._dbType;
    }

    public get startTime(): Date {
        return this._startTime;
    }

    public get endTime(): Date | null {
        return this._endTime;
    }

    public get startTimeAsia(): Date {
        return this._startTimeAsia;
    }

    public get endTimeAsia(): Date | null {
        return this._endTimeAsia;
    }

    public getMinStartTime(): Date {
        return this._startTime < this._startTimeAsia
            ? this._startTime
            : this._startTimeAsia;
    }

    public getMaxEndTime(): Date | null {
        if (!this._endTimeAsia && !this._endTime) {
            return null;
        }

        if (!this._endTime) {
            return this._endTimeAsia;
        }

        if (!this._endTimeAsia) {
            return this._endTime;
        }

        return this._endTime > this._endTimeAsia
            ? this._endTime
            : this._endTimeAsia;
    }
}