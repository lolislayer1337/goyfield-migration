export function getMap<K ,V>(list: V[], getIdFn: (item: V) => K): Map<K, V> {
    const map: Map<K, V> = new Map();

    for (const item of list) {
        map.set(getIdFn(item), item);
    }

    return map;
}

export function getListMap<K, V>(list: V[], getIdFn: (item: V) => K): Map<K, V[]> {
    const map: Map<K, V[]> = new Map();

    for (const item of list) {
        let mapList = map.get(getIdFn(item));
        if (!mapList) {
            mapList = []
            map.set(getIdFn(item), mapList);
        }

        mapList.push(item);
    }

    return map;
}

export function redistributeCounts<T extends object>(list: T[], targetSum: number, countField: keyof T): T[] {
    if (list.length === 0) {
        return [];
    }

    const sum = list.reduce((sum, item) => sum + (item[countField] as number), 0);

    const newValues = list.map(item => {
        const count = item[countField] as number;

        return {
            item,
            value: Math.floor(count * targetSum / sum),
            remainder: count * targetSum % sum
        }
    });

    const newSum = newValues.reduce((sum, item) => sum + item.value, 0);
    let sumRemainder = targetSum - newSum;

    newValues.sort((a, b) => b.remainder - a.remainder);

    for (const item of newValues) {
        if (sumRemainder > 0) {
            sumRemainder--;

            item.item[countField] = item.value + 1 as T[keyof T];
        } else {
            item.item[countField] = item.value as T[keyof T];
        }
    }

    return list;
}