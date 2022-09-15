import { Component } from "@rbxts/knit";
import { Workspace, ServerStorage, CollectionService } from "@rbxts/services";

class Hex implements Component.ComponentClass {
	/**
	 * Knit/CollectionService tag for this component
	 *
	 * @static
	 * @memberof Hex
	 */
	public static Tag = "Hex";

	/**
	 * List of all Hexes, populated as they're loaded by Knit and placed into the
	 * CollectionService
	 *
	 * @private
	 * @static
	 * @type {Hex[]}
	 * @memberof Hex
	 */
	private static HEX_LIST: Hex[] = [];

	/**
	 * Base model for a Hex. Used to build the type definition for HexModel.
	 *
	 * @public
	 * @type {HexModel}
	 * @memberof Hex
	 */
	public model: HexModel = ServerStorage.ComponentModels.Hex;

	/**
	 * Creates an instance of Hex.
	 * @param {Instance} instance provided from the Knit component intialization
	 * @memberof Hex
	 */
	constructor(instance: Instance) {
		// Create a clone of the original hex and load it into ServerStorage
		assert(instance.IsA("Model"));
		this.model = instance.Clone() as HexModel;
		this.model.Parent = ServerStorage.Hexes;
		print(`Transferred ${this.model.Name} into storage`);

		// Log new hex into hex list
		Hex.HEX_LIST.push(this);

		// Remove the original instance from the Workspace
		instance.Destroy();
	}

	/**
	 * Fills the terrain voxels for each part within the hex's Terrain model
	 *
	 * @private
	 * @memberof Hex
	 */
	private LoadTerrain() {
		// Iterate through all parts in HexModel.Terrain to fill them with Workspace terrain
		for (const instance of this.model.Terrain.GetChildren()) {
			// TODO: Add support for sphere, cylinder, and negative parts
			if (instance.ClassName === "Part") {
				assert(instance.IsA("Part"));
				Workspace.Terrain.FillBlock(instance.CFrame, instance.Size, instance.Material);
			} else if (instance.IsA("WedgePart")) {
				Workspace.Terrain.FillWedge(instance.CFrame, instance.Size, instance.Material);
			} else {
				print(
					`[WARN] ${this.model.Name}'s terrain contained illegal terrain part ${instance.Name}: ${instance.ClassName}`,
				);
			}
		}

		this.model.Terrain.Destroy();
	}

	/**
	 * Loads a clone of the Hex into the Workspace at the provided CFrame, and returns
	 *
	 * @param {CFrame} targetCFrame for the new instance of the Hex model.
	 * @return {HexModel} the model of the new instance of the Hex model.
	 * @memberof Hex
	 */
	public Load(targetCFrame: CFrame): HexModel {
		// Create a new dummy model
		const newHex: HexModel = this.model.Clone();
		CollectionService.RemoveTag(newHex, "Hex");
		newHex.PivotTo(targetCFrame);

		// Destroy development scaffolding
		this.model.Links.Destroy();
		this.model.Guides.Destroy();

		// Load terrain for hex
		newHex.Parent = Workspace;
		this.LoadTerrain();

		return newHex;
	}

	/**
	 * Returns a list of all loaded Hexes contained in ServerStorage
	 *
	 * @static
	 * @return {Hex[]}
	 * @memberof Hex
	 */
	public static GetHexList(): Hex[] {
		return Hex.HEX_LIST;
	}

	public Destroy() {
		return;
	}
}

export = Hex;
