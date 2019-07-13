{
	"PANELS": [
		{
			"INTERN": "dialog_welcome",
			"TEXT": "Welcome to GIMLIs home. What can I do for you?",
			"BUTTONS": [
				{
					"TEXT": "Tell me about you.",
					"CLICK": "panel closeall dialog_about_me"
				},
				{
					"TEXT": "Can I buy something here?",
					"CLICK": "panel dialog_no closeall"
				},
				{
					"TEXT": "Bye.",
					"CLICK": "panel closeall"
				}
			]
		},
		{
			"INTERN": "dialog_about_me",
			"TEXT": ["I love the old adventures, especially Monkey Island. Also I like the old Final Fantasies. Not so much the new ones."],
			"BUTTONS": [
				{
					"TEXT": "Well....Ok.",
					"CLICK": "panel closeall"
				}
			]
		},
		{
			"INTERN": "dialog_no",
			"TEXT": ["No."],
			"BUTTONS": [
				{
					"TEXT": "Well....Ok.",
					"CLICK": "panel closeall"
				}
			]
		},
		{
			"INTERN": "ssd_clicked",
			"TEXT": ["<font color='#FF0000'>EXTERNAL LINK</font></br>If you clicked *this* first of everything..the door is on the upper right. Please don't leave me. :)"],
			"BUTTONS": [
				{
					"TEXT": "[LEAVE] But I want to go there now..",
					"CLICK": "link https://benis-bastelschuppen.github.io/NSA"
				},
				{
					"TEXT": "[STAY] Ok, I'll try the door..",
					"CLICK": "panel closeall"
				}

			]
		}

	]
}