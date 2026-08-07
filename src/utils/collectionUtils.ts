export function getMap<K ,V>(list: V[], getIdFn: (item: V) => K): Map<K, V> {
    const map: Map<K, V> = new Map();

    for (const item of list) {
        map.set(getIdFn(item), item);
    }

    return map;
}