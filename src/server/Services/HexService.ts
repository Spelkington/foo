import { KnitServer as Knit, Signal, RemoteProperty, RemoteSignal } from "@rbxts/knit";
import { Workspace, CollectionService, Players, ServerStorage } from "@rbxts/services";
import HexGrid from "server/Utilities/HexGrid";

declare global {
	interface KnitServices {
		HexService: typeof HexService;
	}
}

const HexService = Knit.CreateService({
	Name: "HexService",

	// Server-exposed signals/fields:

	HexesLoading: true,
	HexesLoaded: new Signal(),
	//WorldGenerated: new Signal<(player: Player) => void>(),

	Client: {
		// Client exposed signals:
		WorldGenerator: new RemoteSignal(),

		// Client exposed properties:
		// MostScore: new RemoteProperty(0),
		// Client exposed GetScore method:
		// GetScore(player: Player): number {
		//     return this.Server.GetScore(player);
		// },
	},

	// Initialize
	KnitInit() {
		// Prevent character spawning until all hexes are loaded
		Players.CharacterAutoLoads = false;

		// Begin monitoring Workspace for when all hexes are loaded
		ServerStorage.Hexes.ChildAdded.Connect((_: Instance) => {
			if (this.HexesLoading) {
				for (const instance of Workspace.GetChildren()) {
					if (CollectionService.HasTag(instance, "Hex")) {
						return;
					}
				}

				// If the program passes the early return, there are no more hex instances
				// in the workspace. Set loading to false and trigger HexesLoaded.
				wait();
				this.HexesLoading = false;
				this.HexesLoaded.Fire();
			}
		});

		this.HexesLoaded.Connect(() => {
			// Re-enable character autoloading
			Players.CharacterAutoLoads = true;

			print("All hexes loaded into storage!");

			// const grid = new HexGrid(2, 1);
			// grid.Fill();
			// grid.Load();
		});
	},
});

export = HexService;
