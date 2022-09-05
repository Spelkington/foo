import { Workspace, ServerStorage } from "@rbxts/services"
import Hex from "server/Components/Hex"

class HexGrid {
    private static MODEL_HEX = ServerStorage.ComponentModels.Hex;
    private static DEFAULT_HEX_ID: string;
    protected static HEX_ORIENTATION: CFrame;
    protected static HEX_SIZE: Vector3;

    private grid: Array<Array<Array<Hex>>>;
    private superpositions: Array<Array<Array<Array<Hex>>>>;

    public x_size;
    public y_size;
    public z_size;

    constructor (x: number, y: number, z: number) {

        this.x_size = x;
        this.y_size = y;
        this.z_size = z;

        // Load statics. TODO: Find a more structured place to put this
        let bounding_box = HexGrid.MODEL_HEX.GetBoundingBox();
        HexGrid.HEX_ORIENTATION = bounding_box[0];
        HexGrid.HEX_SIZE = bounding_box[1];

        let defaultHex = Hex.GetHex(HexGrid.DEFAULT_HEX_ID)!

        // Populate grid and superposition arrays
        this.grid = new Array<Array<Array<Hex>>>();
        this.superpositions = new Array<Array<Array<Array<Hex>>>>();
        for (let i = 0; i < this.x_size; i++) {
            this.grid.push(new Array<Array<Hex>>());
            this.superpositions.push(new Array<Array<Array<Hex>>>());
            for (let j = 0; j < this.y_size; j++) {
                this.grid[i].push(new Array<Hex>());
                this.superpositions[i].push(new Array<Array<Hex>>());
                for (let k = 0; k < this.z_size; k++) {
                    this.grid[i][j].push(defaultHex);
                    this.superpositions[i][j].push(Hex.GetHexList());
                }
            }
        }

    }

    public Fill() {
        // TODO: Implement Wave Function Collapse

        let hexList = Hex.GetHexList()
        for (let i = 0; i < this.x_size; i++) {
            for (let j = 0; j < this.y_size; j++) {
                for (let k = 0; k < this.z_size; k++) {
                    let hexIndex = math.floor(math.random() * hexList.size())
                    this.SetHex(i, j, k, hexList[hexIndex]!)
                }
            }
        }

    }

    public SetHex(x: number, y: number, z: number, hex: Hex) {
        assert(x < this.x_size)
        assert(y < this.y_size)
        assert(z < this.z_size)

        this.grid[x][y][z] = hex;
    }

    public Load() {

        let hex_width = HexGrid.HEX_SIZE.Z
        let hex_length = HexGrid.HEX_SIZE.X
        let hex_height = HexGrid.HEX_SIZE.Y

        for (let i = 0; i < this.x_size; i++) {
            for (let j = 0; j < this.y_size; j++) {
                for (let k = 0; k < this.z_size; k++) {

                    // Create the symbolic trapezoidal axial coordinates (https://www.redblobgames.com/grids/hexagons/#:~:text=for%20each%20hex.-,Axial%20coordinates,-%23)
                    let q = i;
                    let r = k;
                    let s = -q - r;

                    let world_x = (r + 0.5*q) * hex_length;
                    let world_y = j * hex_height;
                    let world_z = (0.75*q) * hex_width;

                    Hex.Load(this.grid[i][j][k].name, new CFrame(
                        world_x,
                        world_y,
                        world_z
                    ))

                    // Wait added to avoid loadlocking
                    wait()
                }
            }
        }

    }

}

export = HexGrid;