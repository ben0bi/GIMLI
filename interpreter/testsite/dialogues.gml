{
	"DIALOGS": [
		{
			"INTERN": "dialog_welcome",
			"TEXT": "Welcome to GIMLIs home. What can I do for you?",
			"COLOR": "#69FF69",
			"LOCATION": [10,100],
			"ANSWERS": [
				{
					"TEXT": "Tell me about you.",
					"GOTO": "dialog_about_me"
				},
				{
					"TEXT": "Can I buy something here?",
					"GOTO": "dialog_no"
				},
				{
					"TEXT": "Bye.",
					"SCRIPT": "exit dialog"
				}
			]
		},
		{
			"INTERN": "dialog_about_me",
			"TEXT": ["I love the old adventures, especially Monkey Island."],
			"COLOR": "#69FF69",
			"LOCATION": [10,100],
			"ANSWERS": [
				{
					"TEXT": "Well....Ok.",
					"SCRIPT": "exit dialog"
				}
			]
		}
		
	]
}