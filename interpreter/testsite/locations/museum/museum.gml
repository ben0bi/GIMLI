{
	"LOCATIONS": [
		{
			"NAME": "Museum",
			"INTERN": "photo_museum",
			"BGIMAGE": "museum.png"
		}
	],
	"ITEMS": [
		{
			"NAME": "Teleport to my floor.",
			"INTERN": "door_sleeping_room_to_floor",
			"COLLISIONIMAGE": "museum_door_collision.png",
			"OVERIMAGE": "museum_door.png",
			"onclick": ["jump to floor"],
			"LOCATION": ["photo_museum", 0, 0]
		},
		{
			"NAME": "Planet Erde on Facebook",
			"INTERN": "fotoblog_starforce",
			"OVERIMAGE": "museum_starforce.png",
			"onclick": ["link to https://facebook.com/Planet.Erde.10"],
			"LOCATION": ["photo_museum", 0, 0]
		},
		{
			"NAME": "My private Facebook",
			"INTERN": "fotoblog_parties",
			"OVERIMAGE": "museum_parties.png",
			"onclick": ["link to https://facebook.com/beni.yager"],
			"LOCATION": ["photo_museum", 0, 0]
		}

	]
}
