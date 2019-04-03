{
	"GMLS": ["../../computer_room.gml"],
	"LOCATIONS": [
		{
			"NAME": "Floor",
			"INTERN": "floor",
			"FOLDER": "locations/floor",
			"BGIMAGE": "floor.png"
		}
	],
	"ITEMS": [
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
		}
	]
}