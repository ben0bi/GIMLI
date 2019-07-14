{
	"GMLS": [
				"../../computer_room.gml",	
				"../toilet/toilet.gml",
				"../kitchen/kitchen.gml"
			],
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
			"onclick": ["jump to living_room"],
			"LOCATION": ["floor", 0, 0]
		},
		{
			"NAME": "To the computer room.",
			"INTERN": "door_floor_to_computer_room",
			"COLLISIONIMAGE": "floor_collision_to_computer_room.png",
			"OVERIMAGE": "floor_to_computer_room.png",
			"onclick": ["jump to computer_room"],
			"LOCATION": ["floor", 0, 0]
		},
		{
			"NAME": "Benis Museum",
			"INTERN": "door_floor_to_museum",
			"OVERIMAGE": "floor_to_sleep_room.png",
			"COLLISION": "floor_collision_to_sleep_room.png",
			"onclick": ["jump to photo_museum"],
			"LOCATION": ["floor", 0, 0]
		},
		{
			"NAME": "To the bath room.",
			"INTERN": "door_floor_to_toilet",
			"OVERIMAGE": "floor_to_closet.png",
			"onclick": ["jump to toilet"],
			"LOCATION": ["floor", 0, 0]
		},
		{
			"NAME": "To the kitchen.",
			"INTERN": "door_floor_to_kitchen",
			"OVERIMAGE": "floor_to_kitchen.png",
			"COLLISION": "floor_collision_to_kitchen.png",
			"onclick": ["jump to kitchen"],
			"LOCATION": ["floor", 0, 0]
		},

		{
			"NAME": "Lexikon des Schwindels",
			"INTERN": "floor_typewriter",
			"OVERIMAGE": "typewriter.png",
			"onclick": ["link to https://benis-bastelschuppen.github.io/Lexikon_des_Schwindels/"],
			"SOUND": "sound_typewriter",
			"LOCATION": ["floor", 0, 0]
		}
	],
	"SOUNDS": [
		{
			"INTERN": "sound_typewriter",
			"FILE":	"typewriter.wav"
		}
	]
}
