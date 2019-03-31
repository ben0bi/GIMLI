{
	"STARtLOCATION": "living_room",
	"ScaleFactor": "2.0",
	"LOCATIONS": [
		{
			"NAME": "Living Room",
			"INTERN": "living_room",
			"FOLDER": "locations/living_room",
			"BGIMAGE": "living_room.png"
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
			"BGIMAGE": "floor.png"
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
			"NAME": "To the floor.",
			"INTERN": "door_living_room_to_floor",
			"FOLDER": "locations/living_room",
			"COLLISIONIMAGE": "living_room_door_collision.png",
			"OVERIMAGE": "living_room_door_mouseover.png",
			"onclick": "jump to floor",
			"LOCATION": ["living_room", 380, 0]
		},
		
		{
			"NAME": "To the living room.",
			"INTERN": "door_floor_to_living_room",
			"FOLDER": "locations/floor",
			"COLLISIONIMAGE": "floor_collision_to_living_room.png",
			"OVERIMAGE": "floor_to_living_room.png",
			"onclick": "jump to living_room",
			"LOCATION": ["floor", 0, 0]
		},
		{
			"NAME": "To the computer room.",
			"INTERN": "door_floor_to_computer_room",
			"FOLDER": "locations/floor",
			"COLLISIONIMAGE": "floor_collision_to_computer_room.png",
			"OVERIMAGE": "floor_to_computer_room.png",
			"onclick": "jump to computer_room",
			"LOCATION": ["floor", 0, 0]
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
