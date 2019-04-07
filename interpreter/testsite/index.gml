{
	"STARtLOCATION": "living_room",
	"ScaleFactor": "2.0",
	"GMLS": ["locations/floor/floor.gml", "locations/toilet/toilet.gml"],
	"LOCATIONS": [
		{
			"NAME": "Living Room",
			"INTERN": "living_room",
			"FOLDER": "locations/living_room",
			"BGIMAGE": "living_room.png"
		},
		{
			"NAME": "Museum",
			"INTERN": "photo_museum",
			"FOLDER": "locations/museum",
			"BGIMAGE": "museum.png"
		}],
	"ROOMS": [
		{
			"NAME": "Benis Bastelschuppen",
			"INTERN": "werkstatt",
			"FOLDER": "locations/werkstatt",
			"BGIMAGE": "werkstatt.png"
		}
	],
	"ITEMS": [
		{
			"NAME": "To the floor.",
			"INTERN": "door_living_room_to_floor",
			"FOLDER": "locations/living_room",
			"COLLISIONIMAGE": "living_room_door_collision.png",
			"OVERIMAGE": "living_room_door_mouseover.png",
			"onclick": "jump to floor",
			"LOCATION": ["living_room", 380, 0]
		},
		{
			"NAME": "Teleport to my floor.",
			"INTERN": "door_sleeping_room_to_floor",
			"FOLDER": "locations/museum",
			"COLLISIONIMAGE": "museum_door_collision.png",
			"OVERIMAGE": "museum_door.png",
			"onclick": "jump to floor",
			"LOCATION": ["photo_museum", 0, 0]
		},
		
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
			"OVERIMAGE": "nsa_mouseover.png",
			"onclick": "link to https://benis-bastelschuppen.github.io/NSA",
			"LOCATION": ["living_room", 215, 370]
		}
	]
}
