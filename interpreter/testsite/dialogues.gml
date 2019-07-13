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
					"TEXT": "[STAY] Ok, I'll try the door..",
					"SCRIPT": ["panel closeall"]
				}

			]
		}

	]
}