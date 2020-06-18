{
	"PANELS": [
		{
			"INTERN": "dialog_welcome",
			"TEXT": "Welcome to GIMLIs home. What can I do for you?",
			"BUTTONS": [
				{
					"TEXT": "Tell me about you.",
					"ONCLICK": ["panel closeall dialog_about_me"]
				},
				{
					"TEXT": "Can I buy something here?",
					"SCRIPT": ["panel dialog_no closeall"]
				},
				{
					"TEXT": "I heard about a Museum somwhere in here?..",
					"SCRIPT": ["panel closeall dialog_teleport_museum"]
				},
				{
					"TEXT": "Explain..what is this here?",
					"SCRIPT": ["panel closeall dialog_teleport_computerroom"]
				},
				{
					"TEXT": "Bye.",
					"SCRIPTS": ["panel closeall"]
				}
			]
		},
		{
			"INTERN": "dialog_about_me",
			"TEXT": ["I love the old adventures, especially Monkey Island. Also, I like the old Final Fantasies up to IX. Not so much the new ones. And I love comics. The french ones, like Spirou, Gaston and so on."],
			"BUTTONS": [
				{
					"TEXT": "Really? Well...OK.",
					"SCRIPT": ["panel closeall"]
				}
			]
		},
		{
			"INTERN": "dialog_teleport_museum",
			"TEXT": ["It's in the back, left of the bath room.<br /><br />Would you like to use my mobile teleporter gun?"],
			"BUTTONS": [
				{
					"TEXT": "Yes please, that tickles so well :)",
					"SCRIPT": [
						"panel closeall",
						"jump to photo_museum",
						"panel dialog_thanks_for_teleport"
					]
				},
				{
					"TEXT": "Telepo-what?",
					"SCRIPT": ["panel closeall"]
				}

			]
		},
		{
			"INTERN": "dialog_teleport_computerroom",
			"TEXT": ["The documentation is on my computer in the computer room. It's in the back, right of the bath room.<br /><br />Would you like to use my mobile teleporter gun?"],
			"BUTTONS": [
				{
					"TEXT": "Yes please, that tickles so well :)",
					"SCRIPT": [
						"panel closeall",
						"jump to computer_room",
						"panel dialog_thanks_for_teleport_cpr"
					]
				},
				{
					"TEXT": "Telepo-what?",
					"SCRIPT": ["panel closeall"]
				}

			]
		},
		{
			"INTERN": "dialog_thanks_for_teleport",
			"TEXT": ["Thanks for using benobiGun v2.1"],
			"BUTTONS": [
				{
					"TEXT": "You're welcome.",
					"SCRIPT": ["panel closeall"]
				}

			]
		},
		{
			"INTERN": "dialog_thanks_for_teleport_cpr",
			"TEXT": ["Thanks for using benobiGun v2.1<br /><br />Click on the left display for documentation."],
			"BUTTONS": [
				{
					"TEXT": "You're welcome.",
					"SCRIPT": ["panel closeall"]
				}
			]
		},

		{
			"INTERN": "dialog_no",
			"TEXT": ["No."],
			"BUTTONS": [
				{
					"TEXT": "Well...OK.",
					"SCRIPT": ["panel closeall"]
				}
			]
		},
		{
			"INTERN": "ssd_clicked",
			"TEXT": ["<font color='#FF0000'>EXTERNAL LINK</font></br>If you clicked *this* first of everything..the door is on the upper right. Please don't leave me. :)"],
			"BUTTONS": [
				{
					"TEXT": "[LEAVE] But I want to go there now..",
					"SOUND": "sound_nintendo",
					"SCRIPTS": ["panel closeall", "link https://benis-bastelschuppen.github.io/NSA"]
				},
				{
					"TEXT": "[LEAVE] I would like to see the GIMLI Documentation, <font color=\"#FFAA00\">ASAP</font>!",
					"SCRIPT": ["link to https://github.com/benis-bastelschuppen/GIMLI/wiki"]
				},
				{
					"TEXT": "[STAY] Ok, I'll try the door..",
					"SCRIPT": ["panel closeall"]
				}
			]
		}

	]
}
