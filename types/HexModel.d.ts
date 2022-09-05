type HexModel = Model & {
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
		["0"]: Part;
		["60"]: Part;
		["120"]: Part;
		["180"]: Part;
		["240"]: Part;
		["300"]: Part;
	};
}
