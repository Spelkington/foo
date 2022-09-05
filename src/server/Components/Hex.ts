import { Component, Janitor } from "@rbxts/knit";
import { Workspace, ServerStorage } from "@rbxts/services"

class Hex implements Component.ComponentClass {
    public static Tag = "Hex";
    private static HEX_MAP = new Map<string, Hex>();
    private janitor = new Janitor();
    private model: HexModel = ServerStorage.ComponentModels.Hex;

    public name: string;

    constructor(instance: Instance) {
        assert(instance.IsA("Model"))
        this.model = instance as HexModel;
        this.name = instance.Name

        // If this is an initial load from Knit, move the Hex into storage
        if (!ServerStorage.Hexes.FindFirstChild(this.model.Name)) {
                this.model.Parent = ServerStorage.Hexes
                print(`Transferred ${this.model.Name} into storage`)
                Hex.HEX_MAP.set(this.model.Name, this)
        }
        else if (instance.Parent === Workspace)
        {
                // Destroy helper guides and link data
                this.model.Links.Destroy()
                this.model.Guides.Destroy()
                this.LoadTerrain()
        }
    }

    private LoadTerrain() {
        for (let instance of this.model.Terrain.GetChildren()) {

            // TODO: Add support for sphere, cylinder, and negative parts
            if (instance.ClassName === "Part") {
                assert(instance.IsA("Part"))
                Workspace.Terrain.FillBlock(
                    instance.CFrame,
                    instance.Size,
                    instance.Material
                )
            }
            else if (instance.IsA("WedgePart")) {

                // TODO: Find a way to more gracefully smooth over gaps between adjacent wedge hypots.
                Workspace.Terrain.FillWedge(
                    instance.CFrame,
                    instance.Size,
                    instance.Material
                )
            }
            else {
                print(`[WARN] ${this.model.Name}'s contained illegal terrain part ${instance.Name}`)
            }
        }

        this.model.Terrain.Destroy()
    }

    public static Load(id: string, targetCFrame: CFrame): Model {

        let original = ServerStorage.Hexes.FindFirstChild(id)
        assert(original)
        assert(original.IsA("Model"))

        let newHex = original.Clone();
        newHex.PivotTo(targetCFrame)
        newHex.Parent = Workspace

        // TODO: Load Terrain

        return newHex;
    }

    public static GetHexList(includeEmpty: boolean = false): Array<Hex> {
        let result = new Array<Hex>();
        this.HEX_MAP.forEach((hex: Hex, label: string) => {
            if (includeEmpty || hex.name !== "EmptyHex") {
                result.push(hex)
            }
        });
        return result
    }

    public static GetHex(label: string): Hex | undefined {
        return this.HEX_MAP.get(label);
    }

    public Destroy() {
        this.janitor.Destroy();
    }
}

export = Hex;