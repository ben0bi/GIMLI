{
	"STARtLOCATION": "living_room",
	"ScaleFactor": "2.0",
	"LOCATIONS": [
		{
			"NAME": "Living Room",
			"INTERN": "living_room",
			"FOLDER": "locations/living_room",
			"BGIMAGE": "DSC_4229_living_room.png",
			"ScaleFactor": "0.5"
		},
		{
			"NAME": "Computer Room",
			"INTERN": "computer room",
			"FOLDER": "locations/computer_room",
			"BGIMAGE": "DSC_4228_computer_room.png"
		},
		{
			"NAME": "Floor",
			"INTERN": "floor",
			"FOLDER": "locations/floor",
			"BGIMAGE": "DSC_4230_floor.png"
		},
		{
			"NAME": "Benis Bastelschuppen",
			"INTERN": "werkstatt",
			"FOLDER": "locations/werkstatt",
			"BGIMAGE": "werkstatt.png"
		}
	],
	"ITEMS": [
		{
			"NAME": "Bag of Weed",
			"INTERN": "item_bow",
			"FOLDER": "entities/bag_of_grass",
			"IMAGE": "bag_of_grass.png",
			"DESCRIPTION": "A delicious bag of weed.",
			"script": "jump to living_room",
			"LOCATION": ["werkstatt", 50, 200]
		},
		{
			"NAME": "LEGO for Nintendo Switch",
			"INTERN": "item_nsa",
			"FOLDER": "entities/nsa",
			"IMAGE": "nsa.png",
			"scalefactor": "2.0",
			"OVERIMAGE": "nsa_mouseover.png",
			"onclick": "link to https://benis-bastelschuppen.github.io/NSA",
			"LOCATION": ["living_room", 270, 350]
		}
	]
}
