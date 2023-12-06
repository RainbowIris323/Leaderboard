import { SerializableContainer } from "./types";

export const PlayerDataDefaults: SerializableContainer = {
	Name: "PlayerData",
	Priority: 0,
	Value: [
		{
			Name: "Coins",
			Priority: 0,
			Value: 0,
			LastValue: 0,
		},
		{
			Name: "Playtime",
			Priority: 0,
			Value: 0,
			LastValue: 0,
		},
	],
};
