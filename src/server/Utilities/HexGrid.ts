import { Workspace, ServerStorage, KeyframeSequenceProvider } from "@rbxts/services";
import Hex from "server/Components/Hex";
import HexEntry from "server/Utilities/HexEntry";
import PriorityQueue from "server/Utilities/PriorityQueue";

/**
 * Used as the base container object for the HexGrid, in order to placehold while a
 * HexEntry object is decided by the grid's WaveFunctionCollapse generation process.
 *
 * Contains either the HexEntry of the object, or the possible superpositions that can
 * be collapsed at the physical location represented by the HexPosition object.
 *
 * @class HexPosition
 */
class HexPosition {
	/**
	 * Sample hexagon used for sizing of HexPositions on the underlying HexGrid
	 *
	 * @private
	 * @static
	 * @memberof HexPosition
	 */
	private static SAMPLE_HEX = ServerStorage.ComponentModels.Hex;

	/**
	 * The bounding box of the HexPosition SAMPLE_HEX, used to retrieve the default
	 * orientation and position scaling of new loaded hexes
	 *
	 * @private
	 * @static
	 * @memberof HexPosition
	 */
	private static HEX_BOUNDING_BOX = HexPosition.SAMPLE_HEX.GetBoundingBox();

	/**
	 * Default orientation of hexagons placed into the world. Used as the relative orientation
	 * adjusted within HexEntry.
	 *
	 * @private
	 * @static
	 * @memberof HexPosition
	 */
	private static HEX_ORIENTATION = HexPosition.HEX_BOUNDING_BOX[0];

	/**
	 *
	 *
	 * @private
	 * @static
	 * @memberof HexPosition
	 */
	private static HEX_SIZE = HexPosition.HEX_BOUNDING_BOX[1];

	/**
	 * Index position of the hexagon in the parent HexGrid container
	 *
	 * @private
	 * @type {Vector3}
	 * @memberof HexPosition
	 */
	private GridPosition: Vector3;

	/**
	 * Physical position of the hex in the Workspace
	 *
	 * @private
	 * @type {Vector3}
	 * @memberof HexPosition
	 */
	private WorldPosition: Vector3;

	/**
	 * Possible superposition of HexEntries for this position. Used by the HexGrid's
	 * Wave Function Collapse to determine possible collapsable positions.
	 *
	 * @private
	 * @type {HexEntry[]}
	 * @memberof HexPosition
	 */
	private Superpositions: HexEntry[];

	/**
	 * Flag to determine if this position has already been collapsed.
	 *
	 * @private
	 * @memberof HexPosition
	 */
	private Collapsed = false;

	/**
	 * The HexEntry collapsed in this position. If there is an entry for this position,
	 * the Collapsed property should be true (or false if uncollapsed)
	 *
	 * @private
	 * @type {(HexEntry | undefined)}
	 * @memberof HexPosition
	 */
	private Entry: HexEntry | undefined;

	/**
	 * Creates an instance of HexPosition.
	 *
	 * @param {number} x position of of the hex within its' parent HexGrid
	 * @param {number} y
	 * @param {number} z
	 * @param {HexEntry[]} superpositions
	 * @memberof HexPosition
	 */
	constructor(x: number, y: number, z: number, superpositions: HexEntry[]) {
		// Store grid position into Vector3
		this.GridPosition = new Vector3(x, y, z);

		// Convert grid position into world position
		const hex_length = HexPosition.HEX_SIZE.X;
		const hex_height = HexPosition.HEX_SIZE.Y;
		const hex_width = HexPosition.HEX_SIZE.Z;
		this.WorldPosition = new Vector3(
			(this.GridPosition.Z + 0.5 * this.GridPosition.X) * hex_length,
			y * hex_height,
			0.75 * this.GridPosition.X * hex_width,
		);

		// Instantiate with full superpositions
		this.Superpositions = superpositions;
	}

	/**
	 * Sets the HexEntry of this HexPosition, collapsing its' superposition and removing
	 * all other entries from the HexPosition's superpositions.
	 * @param entry
	 */
	public SetHexEntry(entry: HexEntry) {
		this.Entry = entry;
		this.Collapsed = true;
		this.Superpositions.clear();
	}

	/**
	 * Loads the underlying Hex into the workspace at the world position of this containing
	 * HexPosition.
	 *
	 * @memberof HexPosition
	 */
	public Load() {
		if (this.Entry) {
			this.Entry.Load(this.WorldPosition);
		} else {
			// TODO: Define behavior for non-loaded cell.
		}
	}
}

/**
 * The HexGrid object stores the hexagons used in world generation, and generates the
 * world in a way that adheres to the adjacency rules structured between physical Hex
 * objects.
 *
 * @class HexGrid
 */
class HexGrid {
	/**
	 * 3 dimensional grid storing all HexPositions, along with the HexPositions' under-
	 * lying physical hex models.
	 *
	 * @private
	 * @type {HexPosition[][][]}
	 * @memberof HexGrid
	 */
	private grid: HexPosition[][][];

	/**
	 * The number of steps required to get from the center hex to the maximum edge hexes
	 * within the HexGrid. The number of hexagons for a given radius is Ω( 6*(Σi <= r) + 1 ),
	 * which is roughly Ω(n^2). For example, a radius of 5 will generate a grid with:
	 *
	 * 6 * (1 + 2 + 3 + 4 + 5) + 1 = 91 hexagons
	 *
	 *
	 * @private
	 * @type {number}
	 * @memberof HexGrid
	 */
	private radius: number;
	private hex_range: [number, number];
	private height: number;
	private collapsed = false;

	/**
	 * Creates an instance of HexGrid.
	 * @param {number} radius Number of steps needed to traverse from the middle to edge hexes
	 * @param {number} height Maximum height of the grid
	 * @param {HexEntry[]} superpositions An array of possible beginning HexEntries to be
	 * used as the starting superpositions of all empty cells
	 * @memberof HexGrid
	 */
	constructor(radius: number, height: number, superpositions: HexEntry[]) {
		assert(radius % 2 === 0 && radius >= 0, "HexGrid radius must be an even number.");

		this.radius = radius;
		this.height = height;
		this.hex_range = [-radius / 2, radius / 2];

		// Populate grid and superposition arrays
		// NOTE: This is done in the order of x, z, y to organize hexes into columns,
		// in order to implement maps later on
		this.grid = [];
		for (let x = this.hex_range[0]; x <= this.hex_range[1]; x++) {
			const hexSlice: HexPosition[][] = [];
			this.grid.push(hexSlice);
			for (let z = this.hex_range[0]; z <= this.hex_range[1]; z++) {
				const hexCol: HexPosition[] = [];
				this.grid[x].push(hexCol);
				for (let y = 0; y < this.height; y++) {
					this.grid[x][z].push(new HexPosition(x, y, z, superpositions));
				}
			}
		}
	}

	public Fill() {
		// TODO: Implement Wave Function Collapse

		const queue = new PriorityQueue();
	}

	/**
	 * Retreives the HexPosition at the provided coordinates
	 *
	 * @param {number} x
	 * @param {number} y
	 * @param {number} z
	 * @return {HexPosition}
	 * @memberof HexGrid
	 */
	public get(x: number, y: number, z: number): HexPosition {
		assert(x >= this.hex_range[0] && x <= this.hex_range[1], `X index ${x} out of range.`);
		assert(y < this.height);
		assert(z >= this.hex_range[0] && z <= this.hex_range[1], `Z indez ${x} out of range.`);

		const x_index = x + this.radius / 2;
		const y_index = y;
		const z_index = z + this.radius / 2;

		return this.grid[x_index][z_index][y_index];
	}

	/**
	 * Sets the provided grid position to a new HexPosition
	 *
	 * @param {number} x
	 * @param {number} y
	 * @param {number} z
	 * @param {HexPosition} obj
	 * @memberof HexGrid
	 * @deprecated I can't think of any reason why a HexPosition should be reset following
	 * the intialization, but I didn't consider that before writing the method. Maybe
	 * this will come in handy later.
	 */
	public set(x: number, y: number, z: number, obj: HexPosition) {
		assert(x >= this.hex_range[0] && x <= this.hex_range[1], `X index ${x} out of range.`);
		assert(y < this.height);
		assert(z >= this.hex_range[0] && z <= this.hex_range[1], `Z indez ${x} out of range.`);

		const x_index = x + this.radius / 2;
		const y_index = y;
		const z_index = z + this.radius / 2;

		this.grid[x_index][z_index][y_index] = obj;

		// TODO: Adjust superpositions of neighbors
	}

	/**
	 * Force-sets the hex at the grid location provided
	 *
	 * @param {number} x
	 * @param {number} y
	 * @param {number} z
	 * @param {HexEntry} entry
	 * @memberof HexGrid
	 */
	public SetHexEntry(x: number, y: number, z: number, entry: HexEntry) {
		this.get(x, y, z).SetHexEntry(entry);
	}

	/**
	 * Loads all hexes contained in the grid into the Workspace
	 *
	 * @memberof HexGrid
	 */
	public Load() {
		for (const slice of this.grid) {
			for (const column of slice) {
				for (const position of column) {
					position.Load();
				}
			}
		}
	}
}

export = HexGrid;
