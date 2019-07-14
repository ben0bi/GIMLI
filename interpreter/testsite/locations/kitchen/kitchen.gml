{
	"LOCATIONS": [
		{
			"NAME": "Kitchen",
			"INTERN": "kitchen",
			"BGIMAGE": "kitchen_background.png"
		},
		{
			"NAME": "Balcony",
			"INTERN": "balcony",
			"BGIMAGE": "balcony_background.png"
		}
	],
	"ITEMS": [
		{
			"NAME": "To the floor.",
			"INTERN": "door_kitchen_to_floor",
			"COLLISIONIMAGE": "kitchen_collision_door_to_floor.png",
			"OVERIMAGE": "kitchen_door_to_floor.png",
			"onclick": ["jump to floor"],
			"LOCATION": ["kitchen", 0, 0]
		},
		{
			"NAME": "To the balcony.",
			"INTERN": "door_kitchen_to_balcony",
			"COLLISIONIMAGE": "kitchen_collision_door_balcony.png",
			"OVERIMAGE": "kitchen_door_balcony.png",
			"onclick": ["jump to balcony"],
			"LOCATION": ["kitchen", 0, 0]
		},
		{
			"NAME": "",
			"INTERN": "kitchen_oven",
			"OVERIMAGE": "kitchen_backofen.png",
			"COLLISIONIMAGE": "kitchen_collision_backofen.png",
			"SOUND": "sound_kitchencat",
			"LOCATION": ["kitchen", 0, 0]
		},
		{
			"NAME": "<center>Refrigerator<br /><font color=\"#F00\">(mostly empty)</font></center>",
			"INTERN": "kitchen_refrigerator",
			"OVERIMAGE": "kitchen_refrigerator.png",
			"COLLISIONIMAGE": "kitchen_collision_refrigerator.png",
			"SOUND": "sound_refrigerator",
			"DELAY": 0.1,
			"script": ["panel closeall dialog_welcome"],
			"LOCATION": ["kitchen", 0, 0]
		},
		
		{
			"NAME": "To the computer room.",
			"INTERN": "door_balcony_to_computer_room",
			"COLLISIONIMAGE": "balcony_collision_to_computer_room.png",
			"OVERIMAGE": "balcony_lantern.png",
			"ONCLICK": ["jump to computer_room"],
			"LOCATION": ["balcony", 0, 0]
		},
		{
			"NAME": "To the kitchen.",
			"INTERN": "door_balcony_to_kitchen",
			"OVERIMAGE": "balcony_door_to_kitchen.png",
			"ONCLICK": ["jump to kitchen"],
			"LOCATION": ["balcony", 0, 0]
		}
	],
	"SOUNDS": [
		{
			"INTERN": "sound_kitchencat",
			"FILE": "do_not_bake_the_cat.wav"
		},
		{
			"INTERN": "sound_refrigerator",
			"FILE": "refrigerator.wav"
		}
	]
}
