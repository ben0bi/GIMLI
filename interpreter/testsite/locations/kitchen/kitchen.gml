{
	"LOCATIONS": [
		{
			"NAME": "Kitchen",
			"INTERN": "kitchen",
			"BGIMAGE": "kitchen_background.png"
		}
	],
	"ITEMS": [
		{
			"NAME": "To the floor.",
			"INTERN": "door_kitchen_to_floor",
			"COLLISIONIMAGE": "kitchen_collision_door_to_floor.png",
			"OVERIMAGE": "kitchen_door_to_floor.png",
			"onclick": "jump to floor",
			"LOCATION": ["kitchen", 0, 0]
		},
		{
			"NAME": "To the balcony.",
			"INTERN": "door_kitchen_to_balcony",
			"COLLISIONIMAGE": "kitchen_collision_door_balcony.png",
			"OVERIMAGE": "kitchen_door_balcony.png",
			"onclick": "jump to balcony",
			"LOCATION": ["kitchen", 0, 0]
		},
		{
			"NAME": "",
			"INTERN": "kitchen_oven",
			"OVERIMAGE": "kitchen_backofen.png",
			"SOUND": "sound_kitchencat",
			"LOCATION": ["kitchen", 0, 0]
		}
	],
	"SOUNDS": [
		{
			"INTERN": "sound_kitchencat",
			"FILE": "do_not_bake_the_cat.wav"
		}
	]
}
