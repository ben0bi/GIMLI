
// defined parsers for "standard GML"

// 0.6.08: GML standard array parser prototypes.
// 0.6.14: in own file now.

// the global parser holds some global values.
var GMLParser_GLOBAL = function()
{
	var me = this;
	this.actualRoomIntern = "";
	this.startRoomIntern = "";
	this.scaleFactor = 1.0; // scale factor is 1.0 initial.
	this.parseGML = function(json, rootPath)
	{
		// get the start room. (StartLocation or StartRoom)
		// also set the actual room to the start room.
		if(__defined(json['STARTLOCATION']))
			me.actualRoomIntern = me.startRoomIntern = json['STARTLOCATION'];
		if(__defined(json['STARTROOM']))
			me.actualRoomIntern = me.startRoomIntern = json['STARTROOM'];
		
		// get the global scale factor.
		if(__defined(json['SCALEFACTOR']))
			me.scaleFactor = parseFloat(json['SCALEFACTOR']);
		if(__defined(json['SCALE']))
			me.scaleFactor = parseFloat(json['SCALE']);
	}
	this.clear = function()
	{
		me.actualRoomIntern = "";
		me.startRoomIntern = "";
		me.scaleFactor = 1.0;
	}
}

// The ROOM parser
// data structure for the rooms
var GMLData_ROOM = function()
{
	var me = this;
	this.roomName ="";
	var m_internName = "";
	this.getIntern = function() {return m_internName;}
	this.bgImageFile = "";
	this.folder = "";
	var m_scaleFactor = 1.0;
	// some math.
	this.setScaleFactor=function(newScaleFactor) {m_scaleFactor = parseFloat(newScaleFactor);}
	this.getScaleFactor=function(outerScaleFactor=1.0) {return m_scaleFactor*outerScaleFactor;}
		
	// return the image file including the path.
	this.getBGimagePath=function() {return me.folder+me.bgImageFile;};

	// parse the gml of a ROOM.
	this.parseGML=function(gmlRoom, rootPath="")
	{
		me.setScaleFactor(1.0);
		me.roomName = gmlRoom['NAME'];
		m_internName = gmlRoom['INTERN'];
		me.bgImageFile = "@ BGIMAGE not found. @";
		me.folder = __addSlashIfNot(rootPath);
		
		// check if the json has the entries.
		if(!__defined(me.roomName))
			me.roomName = "@ NAME not found @";
		if(!__defined(m_internName))
			m_internName = "@_INTERN_not_found_@";
		// replace spaces from intern name.
		var i2 = m_internName.split(' ').join('_');
		if(m_internName!=i2)
		{
			log("Spaces are not allowed in intern names. [Location]['"+m_internName+"' ==&gt; '"+i2+"']", LOG_WARN);
			m_internName = i2;
		}

		if(__defined(gmlRoom['FOLDER']))
			me.folder = __shortenDirectory(me.folder+gmlRoom['FOLDER']);
		me.folder=__addSlashIfNot(me.folder);
		
		if(__defined(gmlRoom['BGIMAGE']))
			me.bgImageFile = gmlRoom['BGIMAGE'];
		// set the room scale factor.
		//room.setScaleFactor(m_scaleFactor); // set global scale. 0.0.29: multiply instead of or-ing.
		if(__defined(gmlRoom['SCALEFACTOR']))	// get room scale.
			me.setScaleFactor(parseFloat(gmlRoom['SCALEFACTOR']));
		if(__defined(gmlRoom['SCALE']))	// get room scale 2.
			me.setScaleFactor(parseFloat(gmlRoom['SCALE']));
	};
	
	this.debug=function(loglevel=LOG_DEBUG) {
		log("* ROOM '<span class='jBashCmd'>"+me.roomName+"</span>' (intern: '<span class='jBashCmd'>"+m_internName+"</span>')", loglevel);
		log(" --&gt; resides in '"+me.folder+"'", loglevel);
		log(" --&gt; bgImage: '"+me.bgImageFile+"'", loglevel);
		log(" --&gt; ITEMS:", loglevel);
		var iparser = GMLParser.getParser("ITEMS");
		var arr = [];
		if(iparser!=null)
			arr=iparser.items;
		for(var i=0;i<arr.length;i++)
		{
			if(arr[i].posLocation==m_internName)
				log("--&gt; * "+i+": "+arr[i].getIntern(), loglevel);
		}
		log(" ", loglevel);
	};
}

// the actual parser
var GMLParser_ROOMS = function()
{
	var me = this;
	this.rooms = [];
	this.clear = function() {me.rooms = [];}
	this.parseGML = function(json, rootPath)
	{
		// get locations (LOCATIONS or ROOMS)
		var roomArray = [];
		if(__defined(json['LOCATIONS']))
		{
			var a = json['LOCATIONS'];
			for(var i=0;i<a.length;i++)
				roomArray.push(a[i]);
		}		
		if(__defined(json['ROOMS']))
		{
			var b = json['ROOMS'];
			for(var i=0;i<b.length;i++)
				roomArray.push(b[i]);
		}

		// load in the rooms.
		if(roomArray.length>0)
		{
			for(var i = 0;i<roomArray.length;i++)
			{
				var jroom = roomArray[i];
				var room = new GMLData_ROOM();
				room.parseGML(jroom, rootPath);
				me.rooms.push(room);
				room.debug(LOG_DEBUG_VERBOSE);
			}
		}
	}
}

// The SOUND parser
// data structure for the sound
// the load and play functions are defined in the interpreter.
var GMLData_SOUND = function()
{
	var me = this;
	this.soundFile ="";	// the name of the sound file.
	var m_internName = "";	// the intern name of this sound.
	this.getIntern = function() {return m_internName;};
	this.folder = "";		// folder where the sound resides.
	this.audio = null;		// audio data for this sound file.
	this.duration = 0.0;	// duration of this sound in seconds.

	this.parseGML=function(gmlSound, rootPath="")
	{
		me.folder=__addSlashIfNot(rootPath);
				
		if(__defined(gmlSound['FILE']))
			me.soundFile=gmlSound['FILE'];
		if(__defined(gmlSound['FOLDER']))
			me.folder=__shortenDirectory(me.folder+gmlSound['FOLDER']);
		me.folder=__addSlashIfNot(me.folder);
		if(__defined(gmlSound['INTERN']))
			m_internName = gmlSound['INTERN'];
		var i2 =m_internName.split(' ').join('_');
		if(i2!=m_internName)
		{
			log("Spaces are not allowed in intern names. [Sound]['"+m_internName+"' ==&gt; '"+i2+"']", LOG_WARN);
			m_internName = i2;
		}
		
		//log("SND PATH: "+m_folder+m_soundFile);
// load in interpreter		__load(); // preload the sound.
	};
		
	this.debug = function(loglevel = LOG_DEBUG)
	{
		log("* SOUND: "+m_internName, loglevel);
		log("--&gt; File: "+me.soundFile, loglevel);
		log("--&gt; Duration: "+me.duration+"s", loglevel);
		log("--&gt; resides in: "+me.folder, loglevel);
		log(" ", loglevel);
	}
}

// the actual parser
// 0.6.15: external from gimli-interpreter.js
var GMLParser_SOUNDS = function()
{
	var me = this;
	this.sounds = [];
	this.clear = function() {me.sounds = [];}
	this.parseGML = function(json, rootPath)
	{
		// load in the sounds.
		if(__defined(json['SOUNDS']))
		{
			var soundArray = json['SOUNDS'];
			for(var i=0;i<soundArray.length;i++)
			{
				var sound=soundArray[i];
				var snd = new GMLData_SOUND();
				
				snd.parseGML(sound, rootPath);

				me.sounds.push(snd);
				snd.debug(LOG_DEBUG_VERBOSE);
			}
		}
	}
}

// The ITEM parser
// data structure for the items
// 0.6.17: external from gimli-interpreter.js
var GMLData_ITEM = function()
{
	var me = this;
	var m_internName = ""; // the unique intern name of this item.
	this.getIntern = function() {return m_internName;}
	
	// unique id for DOM element processing.
	var m_id = GMLData_ITEM.getNewID();
	this.getUniqueID = function() {return m_id;}
	
	this.myDiv = null;	// DOM div data for that item. Created outside this class.
	
	this.itemName = "";		// the item name.
	this.folder = "";
	this.description = "";
	this.imageFile = "@ IMAGE not found. @";
	this.overImageFile = "";
	this.collisionImageFile = "";
	this.posLocation = "";		// intern name of the location where this item is located.
	this.posX = 0;
	this.posY = 0;
	this.posZ = 10;				// z index of this item.
	this.script_clicks = [];	// array with the scripts.
	this.clickSound = "";

	this.soundDelay = 1.0;
	this.scaleFactor = 1.0;

	this.collisionDataContext = null; // the collision image pixel data
	this.collisionWidth = 0;
	this.collisionHeight = 0;
	this.collisionScaleFactor = 1.0;

	// if this is false, no further processing will be done on mouseover.
	var m_CollisionLoaded = false;
	this.isCollisionLoaded =function() {return m_CollisionLoaded;};
	this.setCollisionLoaded = function(loaded = true) {m_CollisionLoaded = loaded;}
	
	// get world scale factor.
	this.getScaleFactor=function(outerScaleFactor=1.0) 
	{
		me.collisionScaleFactor = me.scaleFactor * outerScaleFactor;
		return me.collisionScaleFactor;
	}

	this.parseGML = function(gmlItem, rootPath) 
	{
		me.itemName = gmlItem['NAME'];
		m_internName = gmlItem['INTERN'];
		me.folder = __addSlashIfNot(rootPath);
		me.description = gmlItem['DESCRIPTION'];	// description not used yet.
		me.imageFile = "@ IMAGE not found. @";//gmlItem['IMAGE'];
		me.overImageFile = "";//gmlItem['OVERIMAGE'];
		me.collisionImageFile = "";// gmlItem['COLLISIONIMAGE'];
		me.posLocation = "";
		me.posX = 0;
		me.posY = 0;
		me.scripts_click = [];
		me.soundDelay = 1.0;

		if(!__defined(gmlItem['INTERN']))
			m_internName = "@_INTERN_not_found_@";
		// replace spaces from intern name.
		var i2 = m_internName.split(' ').join('_');
		if(m_internName!=i2)
		{
			log("Spaces are not allowed in intern names.[Item]['"+m_internName+"' ==&gt; '"+i2+"']", LOG_WARN);
			m_internName = i2;
		}
		
		// get the location.
		var loca = [];
		if(__defined(gmlItem['LOCATION']))
			loca = gmlItem['LOCATION'];
		if(__defined(gmlItem['ROOM']))
			loca = gmlItem['ROOM'];
		if(loca.length>0)
		{
			var loc = loca[0];
			var loc2 =loc.split(' ').join('_');
			if(loc!=loc2)
				log("Spaces are not allowed in intern names. [Item-Location]['"+loc+"' ==&gt; '"+loc2+"'] in location for item '"+m_internName+"'.", LOG_WARN);
			me.posLocation = loc2;
		}
		if(loca.length>1)
			me.posX = parseInt(loca[1]);
		if(loca.length>2)
			me.posY = parseInt(loca[2]);
		
		// check if the json has the entries.
		if(!__defined(gmlItem['NAME']))
			me.itemName = "@ NAME not found @";
		// check for the folder.
		if(__defined(gmlItem['FOLDER']))
			me.folder = __shortenDirectory(me.folder+gmlItem['FOLDER']);
		me.folder=__addSlashIfNot(me.folder);

		if(!__defined(gmlItem['DESCRIPTION']))
			me.description = "";
		if(__defined(gmlItem['IMAGE']))
			me.imageFile = gmlItem['IMAGE'];
		if(__defined(gmlItem['OVERIMAGE']))
			me.overImageFile = gmlItem['OVERIMAGE'];
		else
			me.overImageFile = me.imageFile;
		// get the collision image file name.	
		if(__defined(gmlItem['COLLISIONIMAGE']))
			me.collisionImageFile = gmlItem['COLLISIONIMAGE'];
		if(__defined(gmlItem['COLLISION']))
			me.collisionImageFile = gmlItem['COLLISION'];
		// if there is no collision image, take another one.
		if(!__defined(gmlItem['COLLISIONIMAGE']) && !__defined(gmlItem['COLLISION']))
		{
			if(me.imageFile!="@ IMAGE not found. @") // take the main image if there is one
				me.collisionImageFile = me.imageFile;
			else
				me.collisionImageFile = me.overImageFile;	// as last solution, take the mouseover image.
		}

		if(__defined(gmlItem['SCALEFACTOR']))	// get item scale.
			me.scaleFactor=parseFloat(gmlItem['SCALEFACTOR']);
		if(__defined(gmlItem['SCALE']))	// get item scale 2.
			me.scaleFactor=parseFloat(gmlItem['SCALE']);
		
		// get the click events
		// 0.5.00
		if(__defined(gmlItem['ONCLICK']))
		{
			var arr = gmlItem['ONCLICK'];
			for(var ic=0;ic<arr.length;ic++)
				me.scripts_click.push(arr[ic])
		}
		if(__defined(gmlItem['SCRIPT']))
		{
			var arr = gmlItem['SCRIPT'];
			for(var ic=0;ic<arr.length;ic++)
				me.scripts_click.push(arr[ic])
		}
		if(__defined(gmlItem['SCRIPTS']))
		{
			var arr = gmlItem['SCRIPTS'];
			for(var ic=0;ic<arr.length;ic++)
				me.scripts_click.push(arr[ic])
		}
				
		// get the sound to play when the item is clicked.
		if(__defined(gmlItem['SOUND']))
			me.clickSound = gmlItem['SOUND'];
		var cs2 = me.clickSound.split(' ').join('_');
		if(me.clickSound!=cs2)
		{
			log("Spaces are not allowed in intern names. [Item-Clicksound]['"+me.clickSound+"' ==&gt; '"+cs2+"']", LOG_WARN);
			me.clickSound = cs2;
		}
		
		// get the sound delay.
		if(__defined(gmlItem['DELAY']))
			me.soundDelay = parseFloat(gmlItem['DELAY']);

	};
	
	this.debug=function(loglevel=LOG_DEBUG) {
		log("* ITEM '"+me.itemName+"' (intern: '"+m_internName+"')", loglevel);
		log(" --&gt; resides in '"+me.folder+"'", loglevel);
		log(" --&gt; Image: '"+me.imageFile+"'", loglevel);
		log(" --&gt; Collision: '"+me.collisionImageFile+"'", loglevel);
		log(" --&gt; Mouseover: '"+me.overImageFile+"'", loglevel);
		log(" --&gt; Clicksound: '"+me.clickSound+"'", loglevel);
		log(" --&gt;      Delay: "+(me.soundDelay*100.0)+"% ("+me.soundDelay+")", loglevel);
		log(" --&gt; Loc./Room: ['"+me.posLocation+"', "+me.posX+", "+me.posY+"]", loglevel);
		log(" ", loglevel);
	};
}
GMLData_ITEM.g_nextItemID = 0;
GMLData_ITEM.getNewID = function()
{
	var id = GMLData_ITEM.g_nextItemID;
	GMLData_ITEM.g_nextItemID+=1;
	return id;
}

// the actual parser
var GMLParser_ITEMS = function()
{
	var me = this;
	this.items  = [];
	this.clear = function() {me.items = [];}
	this.parseGML = function(json, rootPath)
	{
		if(__defined(json['ITEMS']))
		{
			var itemArray = json['ITEMS'];
			for(var i=0;i<itemArray.length;i++)
			{
				var item = itemArray[i];
				var itm = new GMLData_ITEM();
				itm.parseGML(item, rootPath);
				me.items.push(itm);
				itm.debug(LOG_DEBUG_VERBOSE);
			}
		}
	}
}

// The PANEL parser
// data structure for the panel
// 0.6.29: external from interpreter file.
var GMLData_PANEL = function()
{
	var me = this;
	var m_internName = "";
	this.text = ""; // the text for this panel.
	this.getIntern = function() {return m_internName;};
	this.buttons = []; // array with all the buttons for this panel.
	this.panelDiv = null;

	this.parseGML=function(gmlPanel, rootPath)
	{
		// clear the buttons.
		me.buttons = [];
		
		// get the text for this panel.
		if(__defined(gmlPanel['TEXT']))
		{
			var t=gmlPanel['TEXT'];
			me.text="";
			for(var i=0;i<t.length;i++)
				me.text=me.text+t[i];
		}

		// get the intern name for this panel.
		if(__defined(gmlPanel['INTERN']))
			m_internName = gmlPanel['INTERN'];
		var i2 =m_internName.split(' ').join('_');
		if(i2!=m_internName)
		{
			log("Spaces are not allowed in intern names. [Panel]['"+m_internName+"' ==&gt; '"+i2+"']", LOG_WARN);
			m_internName = i2;
		}
		
		// get the buttons for this panel.
		if(__defined(gmlPanel['BUTTONS']))
		{
			for(var i=0;i<gmlPanel['BUTTONS'].length;i++)
			{
				var btn = gmlPanel['BUTTONS'][i];
				var b = new GMLData_PANELBUTTON();
				b.parseGML(btn, rootPath);
				me.buttons.push(b);
			}
		}
		
		// or just one button. buttonS are before button (no s)
		if(__defined(gmlPanel['BUTTON']))
		{
			var btn = gmlPanel['BUTTON'];
			var b = new GMLData_PANELBUTTON();
			b.parseGML(btn, rootPath);
			me.buttons.push(b);	
		}
	};

	this.debug= function(loglevel = LOG_DEBUG_VERBOSE)
	{
		log("* PANEL intern name: "+m_internName,loglevel);
		log("--&gt; Button count: "+me.buttons.length, loglevel);
		log(" ", loglevel);
	}
}

// data structure for the panel buttons.
var GMLData_PANELBUTTON = function()
{
	var me = this;
	var m_internName = "";
	this.getIntern = function() {return m_internName;}
	this.buttonText = "";		// text shown for this button.
	this.buttonFunctions = [];	// jBash function called with this button.
	this.clickSound = "";
	this.soundDelay = 1.0;

	this.parseGML = function(GIMLbutton, rootPath)
	{
		// get the intern name for this panel.
		if(__defined(GIMLbutton['INTERN']))
			m_internName = GIMLbutton['INTERN'];
		var i2 =m_internName.split(' ').join('_');
		if(i2!=m_internName)
		{
			log("Spaces are not allowed in intern names. [Panel]['"+m_internName+"' ==&gt; '"+i2+"']", LOG_WARN);
			m_internName = i2;
		}
		
		if(__defined(GIMLbutton['TEXT']))
			me.buttonText=GIMLbutton['TEXT'];
		// button functions in an array.
		me.buttonFunctions = [];
		if(__defined(GIMLbutton['ONCLICK']))
		{
			var arr = GIMLbutton['ONCLICK'];
			for(var ic=0;ic<arr.length;ic++)
				me.buttonFunctions.push(arr[ic])
		}
		if(__defined(GIMLbutton['SCRIPT']))
		{
			var arr = GIMLbutton['SCRIPT'];
			for(var ic=0;ic<arr.length;ic++)
				me.buttonFunctions.push(arr[ic])
		}
		if(__defined(GIMLbutton['SCRIPTS']))
		{
			var arr = GIMLbutton['SCRIPTS'];
			for(var ic=0;ic<arr.length;ic++)
				me.buttonFunctions.push(arr[ic])
		}

		// loading in the sound.
		if(__defined(GIMLbutton['SOUND']))
			me.clickSound = GIMLbutton['SOUND'];
		var cs2 = me.clickSound.split(' ').join('_');
		if(me.clickSound!=cs2)
		{
			log("Spaces are not allowed in intern names. [Panelbutton-Clicksound]['"+me.clickSound+"' ==&gt; '"+cs2+"']", LOG_WARN);
			me.clickSound = cs2;
		}
		
		// get the sound delay.
		if(__defined(GIMLbutton['DELAY']))
			me.soundDelay = parseFloat(GIMLbutton['DELAY']);
	};
}

// the actual parser
var GMLParser_PANELS = function()
{
	var me = this;
	this.panels = [];
	this.clear = function() {me.panels=[];}
	this.parseGML = function(json, rootPath)
	{
		if(__defined(json['PANELS']))
		{
			var panelArray = json['PANELS'];
			for(var i=0;i < panelArray.length;i++)
			{
				var panel = panelArray[i];
				var pnl = new GMLData_PANEL();
				pnl.parseGML(panel, rootPath);
				me.panels.push(pnl);
				pnl.debug(LOG_DEBUG_VERBOSE);
			}
		}		
	}
}
