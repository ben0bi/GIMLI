{
	"GMLS": ["../../computer_room.gml"],
	"LOCATIONS": [
		{
			"NAME": "Floor",
			"INTERN": "floor",
			"BGIMAGE": "floor.png"
		}
	],
	"ITEMS": [
		{
			"NAME": "To the living room.",
			"INTERN": "door_floor_to_living_room",
			"COLLISIONIMAGE": "floor_collision_to_living_room.png",
			"OVERIMAGE": "floor_to_living_room.png",
			"onclick": "jump to living_room",
			"LOCATION": ["floor", 0, 0]
		},
		{
			"NAME": "To the computer room.",
			"INTERN": "door_floor_to_computer_room",
			"COLLISIONIMAGE": "floor_collision_to_computer_room.png",
			"OVERIMAGE": "floor_to_computer_room.png",
			"onclick": "jump to computer_room",
			"LOCATION": ["floor", 0, 0]
		},
		{
			"NAME": "To the bath room.",
			"INTERN": "door_floor_to_toilet",
			"OVERIMAGE": "floor_to_closet.png",
			"onclick": "jump to toilet",
			"LOCATION": ["floor", 0, 0]
		}
	]
}
