
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
		var arr = GIMLI.instance.getStructure_ITEMS();
		for(var i=0;i<arr.length;i++)
		{
			if(arr[i].getLocationIntern()==m_internName)
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
				// we need to include the project path here instead of "jump to room".
				
				snd.parseGML(sound, rootPath);

				me.sounds.push(snd);
				snd.debug(LOG_DEBUG_VERBOSE);
			}
		}

	}
}

// The ITEM parser
// data structure for the items
var GMLData_ITEM = function()
{
}

// the actual parser
var GMLParser_ITEMS = function()
{
	var me = this;
	this.items  = [];
	this.clear = function() {me.items = [];}
	this.parseGML = function(json, rootPath)
	{
	}
}

// The PANEL parser
// data structure for the panel
var GMLData_PANEL = function()
{
	var m_panelButtons = [];
	
}

// data structure for the panel buttons.
var GMLData_PANELBUTTON = function()
{
}

// the actual parser
var GMLParser_PANELS = function()
{
	var me = this;
	this.panels = [];
	this.clear = function() {me.panels=[];}
	this.parseGML = function(json, rootPath)
	{
	}
}
