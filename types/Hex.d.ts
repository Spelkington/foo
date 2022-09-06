type Hex = Model & {
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
		["60"]: Part & {
			Attachment: Attachment;
		};
		["0"]: Part & {
			Attachment: Attachment;
		};
		["-1"]: Part & {
			Attachment: Attachment;
		};
		["180"]: Part & {
			Attachment: Attachment;
		};
		["1"]: Part & {
			Attachment: Attachment;
		};
		["240"]: Part & {
			Attachment: Attachment;
		};
		["300"]: Part & {
			Attachment: Attachment;
		};
		["120"]: Part & {
			Attachment: Attachment;
		};
	};
}
