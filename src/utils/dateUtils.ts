export function isDateInRange(date: Date, min: Date | null, max: Date | null): boolean {
    if (!min && !max) {
        return true;
    }

    if (min
        && (date.getUTCFullYear() < min.getUTCFullYear()
            || date.getUTCFullYear() === min.getUTCFullYear() && date.getUTCMonth() < min.getUTCMonth()
            || date.getUTCFullYear() === min.getUTCFullYear() && date.getUTCMonth() === min.getUTCMonth() && date.getUTCDate() < min.getUTCDate())
    ) {
        return false;
    }

    if (max
        && (date.getUTCFullYear() > max.getUTCFullYear()
            || date.getUTCFullYear() === max.getUTCFullYear() && date.getUTCMonth() > max.getUTCMonth()
            || date.getUTCFullYear() === max.getUTCFullYear() && date.getUTCMonth() === max.getUTCMonth() && date.getUTCDate() > max.getUTCDate())
    ) {
        return false;
    }

    return true;
}
