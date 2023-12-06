import { t } from "@rbxts/t";

export const SerializableTypes = t.union(t.string, t.number, t.boolean);

export const Serializable = t.interface({
	Name: t.string,
	Priority: t.union(t.number, t.none),
	Value: SerializableTypes,
	LastValue: SerializableTypes,
});

export const SerializableContainer = t.interface({
	Name: t.string,
	Priority: t.union(t.number, t.none),
	Value: t.array(Serializable),
});

export type SerializableTypes = string | number | boolean;

export interface Serializable {
	Name: string;
	Priority: number | undefined;
	Value: SerializableTypes;
	LastValue: SerializableTypes;
}

export interface SerializableContainer {
	Name: string;
	Priority: number | undefined;
	Value: Serializable[];
}

export interface DataStoreTemplate {
	DataStore: DataStore;
	Defaults: SerializableContainer;
	Loaded: Map<unknown, SerializableContainer>;
	Autosave: number;
}

export interface OrderedDataStoreTemplate {
	DataStore: OrderedDataStore;
	Defaults: number;
	Loaded: Map<Player, number>;
}
