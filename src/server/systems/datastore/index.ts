import { DataStoreService, Players } from "@rbxts/services";
import { DataStoreTemplate, OrderedDataStoreTemplate, Serializable, SerializableContainer } from "./types";
import { t } from "@rbxts/t";

export class DataStoreManager {
	private static VERSION = 2; //Used for changing loaded data. (ie. reset)
	private static MAX_TRIES = 4; //Max tries for http requests.

	private static Templates = new Map<string, DataStoreTemplate>();
	private static orderedTemplates = new Map<string, OrderedDataStoreTemplate>();

	//Used for time based resets.
	private static dateTable = os.date("*t", os.time());
	public static dayKey = `Y:${this.dateTable.year} M:${this.dateTable.month} D:${this.dateTable.day}`;
	public static weekKey = `Y:${this.dateTable.year} W:${math.floor(this.dateTable.yday / 7)}`;
	public static monthKey = `Y:${this.dateTable.year} M:${this.dateTable.month}`;

	private static syncs = new Map<
		string,
		{ TemplateName: string; PropertyName: string; Callback: (dataSet: Serializable) => void }
	>();

	/**
	 * Loads a template to the datastore manager.
	 * @param name The name for accessing the loaded template later.
	 * @param defaults The default values for new data in the DataStore.
	 * @param Autosave The time in seconds between each autosave.
	 * @returns [success, error]
	 */
	public static loadTemplate(
		name: string,
		defaults: SerializableContainer,
		Autosave: number | undefined = undefined,
	): [boolean, string | undefined] {
		if (this.Templates.get(name))
			return [false, `DataStoreManager.loadTemplate() Name: "${name}" is allready loaded.`];
		this.Templates.set(name, {
			DataStore: DataStoreService.GetDataStore(`${name}_V${this.VERSION}`),
			Defaults: defaults,
			Loaded: new Map<unknown, SerializableContainer>(),
			Autosave: Autosave ?? -1,
		});
		return [true, undefined];
	}

	/**
	 * Loads an ordered template to the datastore manager.
	 * @param name The name for accessing the loaded template later.
	 * @param defaults The default values for new data in the ordered DataStore.
	 * @returns [success, error]
	 */
	public static loadOrderedTemplate(name: string, defaults: number): [boolean, string | undefined] {
		if (this.orderedTemplates.get(name))
			return [false, `DataStoreManager.loadOrderedTemplate() Name: "${name}" is allready loaded.`];
		this.orderedTemplates.set(name, {
			DataStore: DataStoreService.GetOrderedDataStore(`${name}_O_V${this.VERSION}`),
			Defaults: defaults,
			Loaded: new Map<Player, number>(),
		});
		return [true, undefined];
	}

	/**
	 * Loads data from a given datastore.
	 * @param dataStore The datastore to load data from.
	 * @param key The key for the data in the datastore.
	 * @returns [success, error / data]
	 */
	private static loadData(dataStore: DataStore, key: string): [boolean, unknown] {
		let success = false;
		let err: unknown = "Unknown Error";
		let count = 0;
		while (!success && count < this.MAX_TRIES) {
			[success, err] = pcall(() => dataStore.GetAsync(key)[0]);
			count++;
		}
		if (!success) return [false, err];
		return [true, err];
	}

	/**
	 * Saves data wih a given key.
	 * @param dataStore The datastore to save data in.
	 * @param key The key for the data in the datastore.
	 * @returns [success, error]
	 */
	private static saveData(dataStore: DataStore, key: string, data: SerializableContainer): [boolean, unknown] {
		let success = false;
		let err: unknown = "Unknown Error";
		let count = 0;
		while (!success && count < this.MAX_TRIES) {
			[success, err] = pcall(() => dataStore.SetAsync(key, data));
			count++;
		}
		if (!success) return [false, err];

		return [true, err];
	}

	/**
	 * Adds / subtracts from a value in the ordered datastore.
	 * @param templateName The ordered datastore name that was loaded.
	 * @param key The key for the data.
	 * @param change The number to add/subtract from the data.
	 * @returns [success, error]
	 */
	public static IncrementOrderedData(templateName: string, key: string, change: number): [boolean, unknown] {
		const template = this.orderedTemplates.get(templateName);
		if (!template)
			return [false, `DataStoreManager.IncrementOrderedData() templateName: ${templateName} is not loaded.`];
		let success = false;
		let err: unknown = "Unknown Error";
		let count = 0;
		while (!success && count < this.MAX_TRIES) {
			[success, err] = pcall(() => template.DataStore.IncrementAsync(key, change));
			count++;
		}
		if (!success) return [false, err];
		return [true, err];
	}

	/**
	 * Syncs data from a datastore to a ordered datastore on save.
	 * @param name The template name or the ordered datastore to sync from.
	 * @param playerData The data the player has currently.
	 */
	private static updateSyncs(name: string, playerData: SerializableContainer) {
		this.syncs.forEach((sync) => {
			if (name !== sync.TemplateName) return;
			const dataSet = playerData.Value.find((dataSet) => dataSet.Name === sync.PropertyName);
			if (!dataSet || !t.number(dataSet.Value)) return;
			sync.Callback(dataSet);
		});
	}

	/**
	 * Allows for connections on data save. (used to sync data from datastore to leaderboard stores).
	 * @param templateName The template name to pull from.
	 * @param PropertyName The property to sync.
	 * @param Callback The callback to call on sync.
	 */
	public static addSync(templateName: string, PropertyName: string, Callback: (dataSet: Serializable) => void) {
		this.syncs.set(templateName, { PropertyName: PropertyName, TemplateName: templateName, Callback: Callback });
	}

	private static formatPlayerKey(player: Player) {
		return `P_${player.UserId}`;
	}

	/**
	 * Saves data and updates syncs for a given template on a timed loop.
	 * @param template The template to save data for.
	 */
	private static autoSaveData(template: DataStoreTemplate, player: Player) {
		const data = template.Loaded.get(player.UserId);
		if (data === undefined) return;
		this.saveData(template.DataStore, this.formatPlayerKey(player), data);
		this.updateSyncs(template.Defaults.Name, data);
		task.delay(template.Autosave, () => this.autoSaveData(template, player));
	}

	/**
	 * Loads data for a given player.
	 * @param templateName The template name to load data from.
	 * @returns [success, data / error]
	 */
	public static loadPlayerData(player: Player, templateName: string): [boolean, SerializableContainer | string] {
		const template = this.Templates.get(templateName);
		if (!template) return [false, `DataStoreManager.loadPlayerData() templateName: ${templateName} is not loaded.`];
		template.Loaded.set(player.UserId, template.Defaults);
		const [success, err] = this.loadData(template.DataStore, this.formatPlayerKey(player));
		if (!success) return [false, `DataStoreManager.loadPlayerData() Load Failed: ${err}`];
		let data = err;
		if (data === undefined) data = template.Defaults;
		if (!SerializableContainer(data))
			return [false, `DataStoreManager.loadPlayerData() Invalid data type: ${data}`];
		template.Loaded.set(player.UserId, data);
		if (template.Autosave !== -1) task.delay(template.Autosave, () => this.autoSaveData(template, player));
		return [true, data];
	}

	/**Saves all data linked to a player and updates syncs. */
	public static removePlayer(player: Player) {
		const output: [boolean, unknown][] = [];
		this.Templates.forEach((template) => {
			const data = template.Loaded.get(player.UserId);
			if (data === undefined) return;
			this.updateSyncs(template.Defaults.Name, data);
			template.Loaded.delete(player.UserId);
			const out = this.saveData(template.DataStore, this.formatPlayerKey(player), data);
			output.push(out);
		});
		return output;
	}

	/**
	 * Gets data loaded for a given player.
	 * @param templateName The template name for the data.
	 * @returns data / none.
	 */
	public static getData(player: Player, templateName: string): SerializableContainer | undefined {
		const template = this.Templates.get(templateName);
		if (!template) return;
		const data = template.Loaded.get(player.UserId);
		if (data === undefined) return;
		if (!SerializableContainer(data)) return;
		return data;
	}

	/**
	 * Gets the top players from a given ordered datastore.
	 * @param templateName The ordered datastore template to get.
	 * @param quantity Number of top players to get.
	 * @returns Array<[player name, score]>
	 */
	public static getTopPlayers(templateName: string, quantity: number): { Name: string; Score: number }[] {
		const template = this.orderedTemplates.get(templateName);
		if (!template) return [];
		let success = false;
		let err: unknown = "Unknown Error";
		let count = 0;
		while (!success && count < this.MAX_TRIES) {
			[success, err] = pcall(function () {
				return template.DataStore.GetSortedAsync(false, quantity);
			});
			count++;
		}
		if (!success) return [];
		const page = (err as DataStorePages).GetCurrentPage();
		const output: { Name: string; Score: number }[] = [];
		page.forEach((content) => {
			const key = tonumber(content.key);
			if (!t.number(key)) return;
			const user = Players.GetNameFromUserIdAsync(key);
			if (user === undefined) return;
			output.push({ Name: user, Score: tonumber(content.value) ?? 0 });
		});
		return output;
	}
}
