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

Refer to the documentation folder for more information.

A GIML-Page is running on http://ben0bi.dlinkddns.com
    
Look at the testsite/index.gml file for the basic structure.

Newest Additions:
Sounds. Play a sound when an item is clicked. Sound makes 80% of the experience I learned, so use that functionality. ;)    
Load GML files from GML files with relative directories in them.
You can omit the "FOLDER" tag by putting the file into the right folder.