{
	"LOCATIONS": [
		{
			"NAME": "Toilet",
			"INTERN": "toilet",
			"BGIMAGE": "toilet.png"
		}
	],
	"ITEMS": [
		{
			"NAME": "To the floor.",
			"INTERN": "toilet_to_floor",
			"COLLISIONIMAGE": "toilet_door_collision.png",
			"OVERIMAGE": "toilet_door.png",
			"onclick": ["jump to floor"],
			"LOCATION": ["toilet", 0, 0]
		},
		{
			"NAME": "",
			"INTERN": "toilet_curtain",
			"COLLISIONIMAGE": "toilet_open_curtain_collision.png",
			"OVERIMAGE": "toilet_open_curtain_1.png",
			"LOCATION": ["toilet", 0, 0]
		},
		{
			"NAME": "",
			"INTERN": "toilet_closet",
			"OVERIMAGE": "toilet_closet.png",
			"SOUND": "sound_toilet_flushing",
			"LOCATION": ["toilet", 0, 0]
		}
	],
	"SOUNDS": [
		{
			"INTERN": "sound_toilet_flushing",
			"FILE": "toilet-flushing.wav"
		}
	]
}