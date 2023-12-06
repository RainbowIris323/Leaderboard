import { t } from "@rbxts/t";
import { DataStoreManager } from "../datastore";

export class leaderboard {
	private static SECONDS_PER_PLAYTIME = 5;

	static createNewLeaderstats(player: Player) {
		const leaderstats = new Instance("Folder");
		leaderstats.Name = "leaderstats";
		leaderstats.Parent = player;

		const data = DataStoreManager.getData(player, "PlayerData");

		if (!data) return;

		data.Value.forEach((dataSet) => {
			if (!t.number(dataSet.Value)) return;
			const intValue = new Instance("IntValue");
			intValue.Name = dataSet.Name;
			intValue.Value = dataSet.Value;
			intValue.Parent = leaderstats;

			if (dataSet.Priority === undefined) return;
			const priority = new Instance("IntValue");
			priority.Name = "Priority";
			priority.Value = dataSet.Priority;
			priority.Parent = intValue;
		});

		task.delay(this.SECONDS_PER_PLAYTIME, () => this.updatePlaytime(player));
	}

	private static updatePlaytime(player: Player) {
		this.updateStat(player, "Playtime", 1);
		task.delay(this.SECONDS_PER_PLAYTIME, () => this.updatePlaytime(player));
	}

	static setStat(player: Player, statName: string, value: number) {
		const stat = this.getStat(player, statName);
		if (!stat) return;
		stat.Value = value;
		const statInstance = player.FindFirstChild("leaderstats")?.FindFirstChild(statName);
		if (statInstance === undefined || !statInstance.IsA("IntValue")) return;
		statInstance.Value = value;
	}

	static getStat(player: Player, statName: string) {
		const data = DataStoreManager.getData(player, "PlayerData");
		if (!data) return;
		return data.Value.find((stat) => stat.Name === statName);
	}

	static updateStat(player: Player, statName: string, change: number) {
		const stat = this.getStat(player, statName);
		if (!stat || !t.number(stat.Value)) return;
		this.setStat(player, statName, stat.Value + change);
	}
}
