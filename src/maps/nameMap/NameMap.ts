import { ItemNameEntity } from "@maps/nameMap/ItemNameEntity.js";
import { getMap } from "@utils/collectionUtils.js";

export class NameMap {
    private readonly _byId: Map<string, ItemNameEntity>;
    private readonly _byName: Map<string, ItemNameEntity>;

    public constructor(list: ItemNameEntity[]) {
        this._byId = getMap(list, item => item.id);
        this._byName = getMap(list, item => item.name);
    }

    public getNameById(id: string): string | null {
        return this._byId.get(id)?.name ?? null;
    }

    public getIdByName(name: string): string | null {
        return this._byName.get(name)?.id ?? null;
    }
}