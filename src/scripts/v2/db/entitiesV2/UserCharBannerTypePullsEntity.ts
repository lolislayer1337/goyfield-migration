export interface UserCharBannerTypePullsEntity {
    profileId: bigint;
    bannerType: string;
    last6Pull: number;
    last5Pull: number;
    lastWin5050Pull: number;
    lastPullTimeTs: bigint;
}