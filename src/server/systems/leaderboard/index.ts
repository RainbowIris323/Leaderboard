import { t } from "@rbxts/t";
import { DataStoreManager } from "../datastore";

/**
 * The main entry point for leaderboard stats.
 * For availible stats see "src/server/systems/datastore/templates.ts"
 */
export class leaderboard {
	private static SECONDS_PER_PLAYTIME = 5; //The number of seconds per playtime point.

	/**Adds the leaderstats folder to a player and loads the PlayerData template. */
	public static createNewLeaderstats(player: Player) {
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

		task.delay(this.SECONDS_PER_PLAYTIME, () => this.updatePlaytime(player)); //Starts the playtime loop.
	}

	private static updatePlaytime(player: Player) {
		this.updateStat(player, "Playtime", 1);
		task.delay(this.SECONDS_PER_PLAYTIME, () => this.updatePlaytime(player));
	}

	/**
	 * Sets a players stat to a given value.
	 * @param statName The name of the stat shown in the PlayerData template.
	 */
	public static setStat(player: Player, statName: string, value: number): number | undefined {
		const stat = this.getStat(player, statName);
		if (!stat) return;
		stat.Value = value;
		const statInstance = player.FindFirstChild("leaderstats")?.FindFirstChild(statName);
		if (statInstance === undefined || !statInstance.IsA("IntValue")) return;
		if (value < 0) statInstance.Value = 0;
		else statInstance.Value = value;
		return value;
	}

	/**
	 * Returns the value of a player stat if any exists.
	 * @param statName The name of the stat shown in the PlayerData template.
	 */
	public static getStat(player: Player, statName: string) {
		const data = DataStoreManager.getData(player, "PlayerData");
		if (!data) return;
		return data.Value.find((stat) => stat.Name === statName);
	}

	/**
	 * Adds the change to a stat if the stat goes negitive it will be zero
	 * @param statName The name of the stat shown in the PlayerData template.
	 */
	public static updateStat(player: Player, statName: string, change: number): number | undefined {
		const stat = this.getStat(player, statName);
		if (!stat || !t.number(stat.Value)) return;
		if (stat.Value + change < 0) this.setStat(player, statName, 0);
		else this.setStat(player, statName, stat.Value + change);
		return stat.Value;
	}

	/**
	 * Adds the change to a stat if the stat goes negitive the process will fail.
	 * @param statName The name of the stat shown in the PlayerData template.
	 * @returns [success, (if fail: error | quantity short) (if success: new value)]
	 */
	public static tryUpdateStat(player: Player, statName: string, change: number): [boolean, string | number] {
		const stat = this.getStat(player, statName);
		if (!stat || !t.number(stat.Value))
			return [false, `Stat: ${statName} does not exist on player: ${player.Name}`];
		if (stat.Value + change < 0) return [false, math.abs(stat.Value + change)];
		else this.setStat(player, statName, stat.Value + change);
		return [true, stat.Value];
	}
}
