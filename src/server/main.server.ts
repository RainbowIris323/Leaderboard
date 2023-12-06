import { Players } from "@rbxts/services";
import { DataStoreManager } from "./systems/datastore";
import { PlayerDataDefaults } from "./systems/datastore/templates";
import { leaderboard } from "./systems/leaderboard";
import { t } from "@rbxts/t";

DataStoreManager.loadTemplate("PlayerData", PlayerDataDefaults, 10);

DataStoreManager.loadOrderedTemplate("A_Coins", 0);
DataStoreManager.loadOrderedTemplate(`${DataStoreManager.weekKey}_W_Coins`, 0);
DataStoreManager.loadOrderedTemplate(`${DataStoreManager.dayKey}_D_Coins`, 0);

function PlayerAdded(player: Player) {
	DataStoreManager.loadPlayerData(player, "PlayerData");
	leaderboard.createNewLeaderstats(player);

	DataStoreManager.addSync("PlayerData", "Coins", (dataSet) => {
		if (!t.number(dataSet.Value) || !t.number(dataSet.LastValue)) return;
		DataStoreManager.IncrementOrderedData("A_Coins", tostring(player.UserId), dataSet.Value - dataSet.LastValue);
		DataStoreManager.IncrementOrderedData(
			`${DataStoreManager.weekKey}_W_Coins`,
			tostring(player.UserId),
			dataSet.Value - dataSet.LastValue,
		);
		DataStoreManager.IncrementOrderedData(
			`${DataStoreManager.dayKey}_D_Coins`,
			tostring(player.UserId),
			dataSet.Value - dataSet.LastValue,
		);
		dataSet.LastValue = dataSet.Value;
	});
}

function PlayerRemovingSimulation(player: Player) {
	DataStoreManager.removePlayer(player);
}

Players.PlayerAdded.Connect((player) => PlayerAdded(player));

function loop() {
	Players.GetPlayers().forEach((player) => leaderboard.updateStat(player, "Coins", 1));
	task.delay(1, () => loop());
}
loop();

function getLeaderboard() {
	print(" ");
	print("All time");
	DataStoreManager.getTopPlayers("A_Coins", 10).forEach((value, index) => {
		print(` ${index + 1} - User: ${value.Name} | Coins: ${value.Score}`);
	});
	print("Weekly");
	DataStoreManager.getTopPlayers(`${DataStoreManager.weekKey}_W_Coins`, 10).forEach((value, index) => {
		print(` ${index + 1} - User: ${value.Name} | Coins: ${value.Score}`);
	});
	print("Daily");
	DataStoreManager.getTopPlayers(`${DataStoreManager.dayKey}_D_Coins`, 10).forEach((value, index) => {
		print(` ${index + 1} - User: ${value.Name} | Coins: ${value.Score}`);
	});
	task.delay(15, () => getLeaderboard());
}
getLeaderboard();

task.wait(300);

Players.GetPlayers().forEach((player) => PlayerRemovingSimulation(player));
