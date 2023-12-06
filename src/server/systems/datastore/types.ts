import { t } from "@rbxts/t";

//Types that are allowed be stored in DataStores.
export const SerializableTypes = t.union(t.string, t.number, t.boolean);
export type SerializableTypes = string | number | boolean;

//A basic dataset for formating data.
export const Serializable = t.interface({
	Name: t.string,
	Priority: t.union(t.number, t.none),
	Value: SerializableTypes,
	LastValue: SerializableTypes,
});
export interface Serializable {
	Name: string;
	Priority: number | undefined;
	Value: SerializableTypes;
	LastValue: SerializableTypes;
}

//A container for datasets.
export const SerializableContainer = t.interface({
	Name: t.string,
	Priority: t.union(t.number, t.none),
	Value: t.array(Serializable),
});
export interface SerializableContainer {
	Name: string;
	Priority: number | undefined;
	Value: Serializable[];
}

//A format for a root datastore.
export interface DataStoreTemplate {
	DataStore: DataStore;
	Defaults: SerializableContainer;
	Loaded: Map<unknown, SerializableContainer>;
	Autosave: number;
}

//A format for synced data for ordering like leaderboards.
export interface OrderedDataStoreTemplate {
	DataStore: OrderedDataStore;
	Defaults: number;
	Loaded: Map<Player, number>;
}
