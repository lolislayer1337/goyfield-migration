export interface UserWeaponBannerPullsEntity {
    profileId: bigint;
    bannerId: string;
    last6Pull: number;
    last5Pull: number;
    lastWin5050Pull: number;
    lastPullTimeTs: bigint;
}