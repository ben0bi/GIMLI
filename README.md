# GIMLI
Game Induced Markup Language Interpreter

including a test site.

Yes, it is not Web-site anymore. When you find webs on your site, you usually clean them.

So. GIMLI. A great dwarf. Visited Moria. I think. Don't remember it right...

Game induced means there are IMAGES and they do not only serve as images but as interactive 
panels to do stuff on them.

Like in an adventure. And an adventure it is, the inter[web]nets.

The main GIMLI file format would be JSON if possible. And PNG, of course.
I would like to make some script language just for it, but JS serves good for now.

So, there you have an index.gml file. 
This will be loaded by the (now JS-made) GIMLI-interpreter and
load some specs: Rooms with names, folder and background images and items with about the same and some other specs.
Don't know what exactly now. All the stuff [items] could have it's own gml file, let's see how it turns out.
Then it interprets the "STARTLOCATION" entry in the gml file and whoa...there you are. :)

It will show 1. an image, with 2. items on it and 3. doors/ways to go to. That are the links. Items could be
items in a store, like some screws on Hornbach "Screw you haha" or just some stuff to amuse the user,
like a ball to play with. If you click an Item, a script would be loaded and do some stuff like putting
the screws into your bag ("Warenkorb") or moving the ball a little on the screen. Or it could open
a customized GIMLI-Window, like for paying the screws on the "real market".

IT IS halfway RUNNING. But please look at the file structure in the "testsite" folder.

This are the defined words for GML right now. All array indexes (names) will be converted to uppercase letters.    
Preferred means, if both words appear in the GML file at the same "location", the preferred word stuff will be loaded over the other one.

STARTLOCATION, STARTROOM  	// This is the starting point for the user. It is the intern name of a room.    
							// ROOM is preferred over LOCATION
SCALEFACTOR, SCALE			// the scalefactor can be set globally, per room and per item. It will scale like that: Global->Room->Item.    
							// SCALE is preferred over SCALEFACTOR
							// So, if the item has no scale factor, it will take the rooms one.
							// If the room has none, it will take the global one.
NAME						// the display name of a room or item.    
INTERN						// the internal name of a room or item, which is used by the program code.    
FOLDER						// the folder where the images and other stuff of the item or room resides in. Seen from the directory with the gml-file.
BGIMAGE						// the rooms background image. From that one we take the size to calculate scrolling constraints and screen centering.
LOCATIONS, ROOMS			// Array with the room specs in it. ROOMS is preferred over LOCATIONS.    
ITEMS						// Array with the items in it. Not yet supported.   

Look at the testsite/index.gml file for the basic structure.