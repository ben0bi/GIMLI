{
	"STARtLOCATION": "living_room",
	"ScaleFactor": "2.0",
	"GMLS": [
		"locations/floor/floor.gml",
		"locations/museum/museum.gml",
		"dialogues.gml"
		],
	"LOCATIONS": [
		{
			"NAME": "Living Room",
			"INTERN": "living_room",
			"FOLDER": "locations/living_room",
			"BGIMAGE": "living_room.png"
		}
	],
	"ITEMS": [
		{
			"NAME": "To the floor.",
			"INTERN": "door_living_room_to_floor",
			"FOLDER": "locations/living_room",
			"COLLISIONIMAGE": "living_room_door_collision.png",
			"OVERIMAGE": "living_room_door_mouseover.png",
			"onclick": ["jump to floor"],
			"LOCATION": ["living_room", 380, 0]
		},
		{
			"NAME": "LEGO for Nintendo Switch",
			"INTERN": "item_nsa",
			"FOLDER": "entities/nsa",
			"IMAGE": "nsa.png",
			"OVERIMAGE": "nsa_mouseover.png",
			"onclick": ["panel closeall ssd_clicked"],
			"SOUND": "sound_nintendo",
			"DELAY": 0.25,
			"LOCATION": ["living_room", 215, 370]
		},
		{
			"NAME": "Meine Serien",
			"INTERN": "lookat_tv",
			"FOLDER": "locations/living_room",
			"IMAGE": "living_room_tv.png",
			"OVERIMAGE": "living_room_tv_overlay.png",
			"onclick": ["panel closeall", "link to https://bs.to/andere-serien"],
			"SOUND": "sound_nintendo",
			"DELAY": 0.25,
			"LOCATION": ["living_room", 0, 0]
		}
	],
	"SOUNDS": [
		{
			"INTERN": "sound_nintendo",
			"FILE": "nintendo.wav",
			"FOLDER": "entities/nsa"
		}
	]
}
