import Hex from "server/Components/Hex";

/**
 * The HexEntry class used to assign an orientation and adjacencies to an underlying
 * Hex object, in order to store, use, and transform the orientation of Hex objects
 * for use in accounting for rotation and transformation in the HexGrid's
 * WaveFunctionCollapse implementation.
 *
 * @class HexEntry
 */
class HexEntry {
	private static ENTRY_MAP: Map<string, HexEntry> = new Map<string, HexEntry>();

	private hex: Hex;
	private rotation: number;

	/**
	 * Representation of valid adjacency rules for this HexEntry, denoted by valid
	 * HexEntry name strings to be retrieved via the HexEntry.ENTRY_MAP. The first dimen-
	 * sion of the list has 8 elements, each containing a list of valid adjacencies. Each
	 * hex side's rules are mapped to indices as:
	 *
	 *     0
	 *  5 / \ 1
	 *  4 \_/ 2
	 *     3
	 *
	 * Above: 6
	 * Below: 7
	 *
	 * @private
	 * @type {HexEntry[][]}
	 * @memberof HexEntry
	 */
	private adjacencies: string[][];
	private name: string;

	/**
	 * Creates an instance of HexEntry.
	 * @param {Hex} hex describing the physical model and state of this entry
	 * @param {(0 | 60 | 120 | 180 | 240 | 300)} rotation, measured in subsets of 60
	 * degrees between 0 and 360 degrees exclusive
	 * @memberof HexEntry
	 */
	constructor(hex: Hex, rotation: number) {
		this.hex = hex;
		this.rotation = rotation;
		this.name = this.hex.model.Name + this.rotation;
		this.adjacencies = this.AddAdjacencies(this.hex, this.rotation);

		// Log creation of entry into the Entry Map
		HexEntry.ENTRY_MAP.set(this.name, this);
	}

	public static ConstructAllHexTransformations(hex: Hex) {
		for (const rotation of [0, 60, 120, 180, 240, 300]) {
			new HexEntry(hex, rotation);
		}
	}

	/**
	 * Adds the adjacencies to the HexEntry object, accounting for the rotation of this
	 * entry to rotate both the entries and adjacencies
	 * @param hex
	 * @param rotation
	 * @returns
	 */
	private AddAdjacencies(hex: Hex, rotation: number): string[][] {
		// Populate first layer of adjacency list with initial empty sublists
		const result: string[][] = [];

		for (let i = 0; i < 8; i++) {
			result.push(new Array<string>());
		}

		const links = hex.model.Links;
		for (const sideLink of links.GetChildren()) {
			// Verify correct number-able name
			const sideValue = tonumber(sideLink.Name);
			assert(sideValue, `Link subset ${sideLink.Name} could not be converted to number value.`);

			// Verify existence of attachment within side link
			const sideAttachment = sideLink.FindFirstChildOfClass("Attachment");
			assert(sideAttachment, `${sideLink} link within ${hex.model.Name} did not contain an Attachment`);

			// Convert side models to internal adjacency integers
			if (sideValue % 10 === 0) {
				const adjValue = (sideValue + rotation) % 360;
				const sideIndex = sideValue / 60;

				// Iterate through all constraints in the link
				for (const constraint of sideAttachment.GetChildren()) {
					// Assert children are constraints
					assert(
						constraint.IsA("Constraint"),
						`${constraint.Name} within ${hex.model.Name} was not a valid Constraint`,
					);

					const neighborValues = HexEntry.GetNeighborValuesFromConstraint(constraint);
					const neighborName = neighborValues[0];

					// NOTE: This was calculated from hex rotational A to B distance,
					// but incorporates the base rotation. I didn't check this, and if
					// things get fucked up with the orientations this would be the first
					// place I'd look.
					const neighborOrientation = (adjValue - neighborValues[1] + 540) % 360;

					// Compile neighbor tag of name + orientation value
					const neighborTag = neighborName + neighborOrientation;

					// Push to adjacency list at the side index value
					result[sideIndex].push(neighborTag);
				}
			} else {
				// In this case, the hex is above or below.
				let sideIndex = 6; // Lower index
				if (sideValue === 1) {
					sideIndex = 7; // Upper index
				}

				for (const constraint of sideAttachment.GetChildren()) {
					// Assert children are constraints
					assert(
						constraint.IsA("Constraint"),
						`${constraint.Name} within ${hex.model.Name} was not a valid Constraint`,
					);

					const neighborValues = HexEntry.GetNeighborValuesFromConstraint(constraint);
					const neighborName = neighborValues[0];

					// NOTE: I've decided to try and let side-adjacent hexes take soft precedent,
					// so currently the strategy for adjacency is to simply allow all orientations
					// of above/below neighbors to be valid rules.
					for (const orientation of [0, 60, 120, 180, 240, 300]) {
						const neighborTag = neighborName + orientation;
						result[sideIndex].push(neighborTag);
					}
				}
			}
		}

		return result;
	}

	/**
	 * TODO: Documentation
	 *
	 * @private
	 * @static
	 * @param {Constraint} constraint
	 * @return {*}  {[string, number]}
	 * @memberof HexEntry
	 */
	private static GetNeighborValuesFromConstraint(constraint: Constraint): [string, number] {
		const neighborAttach = constraint.Attachment1;
		const neighborLink = neighborAttach!.Parent;
		const neighborModel = neighborLink!.Parent;
		const neighborModelSide = tonumber(neighborLink!.Name);
		assert(
			neighborModelSide,
			`Neighboring link subset ${neighborLink!.Name} could not be converted to number value.`,
		);

		return [neighborModel!.Name, neighborModelSide];
	}

	/**
	 * Loads the underlying physical Hex object into the Workspace, assigning it the
	 * orientation provided by this HexEntry object and loading it into the provided
	 * position.
	 * @param position to load the underlying physical hex into Workspace
	 */
	public Load(position: Vector3) {
		// Compose rotated CFrame for the hexagon
		const positionCFrame = new CFrame(position);
		const orientationCFrame = CFrame.Angles(0, this.rotation, 0);
		const fullCFrame = positionCFrame.mul(orientationCFrame);

		// Populate entry's adjacency map

		// Load hex at CFrame
		this.hex.Load(fullCFrame);
	}
}

export default HexEntry;
