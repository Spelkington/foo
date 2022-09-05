interface ServerStorage extends Instance {
	Hexes: Folder;
	ComponentModels: Folder & {
		Hex: Model & {
			Terrain: Model;
			Guides: Model & {
				UpperBaseplate: UnionOperation & {
					Texture: Texture;
				};
				NorthArrow: Model;
				LowerBaseplate: UnionOperation & {
					Texture: Texture;
				};
				BoundingBox: SelectionBox;
			};
			Constructions: Model;
			Links: Model & {
				["60"]: Part;
				["0"]: Part;
				["180"]: Part;
				["240"]: Part;
				["300"]: Part;
				["120"]: Part;
			};
		};
	};
}
