 /*

 ..............................................
 .                           GIML-INTERPRETER .
 ..............................................
 . VERSION A : CLIENT JS                      .
 . by Benedict Jäggi                          .
 . Licensed under the                         .
 . GNU General Public License                 .
 . (see LICENSE file)                         .
 . NOT copying this work is prohibited :)     .
 ..............................................
 . GIML[I] stands for:                        .
 . Game Induced Markup Language [Interpreter] .
 ..............................................

 needs jQuery, BeJQuery and jBash.
 See the GIMLI-JSFILES.json in the config dir.
 
*/

const GIMLIVERSION = "0.2.0";

// check if a variable is defined or not.
function __defined(variable)
{
	if(typeof(variable)==="undefined")
		return false;
	return true;
}

// remove all "dir/../" combinations to get "unique" directories from each subfolder.
function __shortenDirectory(longdir)
{
	var dir = "";
	var arr = [];
	for(var i=0;i<longdir.length;i++)
	{
		var lc = longdir[i];
		var ret =0;
		// put all directory names into an array.
		if(lc=="/" || lc=="\\" || i==longdir.length-1)
		{
			if(lc=="/" || lc=="\\")
				dir=dir+"/";	// set same slash everywhere.
			else
				dir=dir+lc;
			
			arr.push(dir);
			dir="";
		}else{
			dir=dir+lc;
		}
	}
	
	var done = false;
	while(!done)
	{
		var arr2=[];
		var dirpushed = false;
		var firstdirpushed = false;
		//console.log("turn");
		done = true;
		for(var i=0;i<arr.length;i++)
		{
			var a1=arr[i];
			if(a1!="../")
			{
				arr2.push(a1);
				dirpushed = true;
				firstdirpushed = true;
			}else{
				// it's ../, go one dir back.
				// but only if there is a dir before.
				//console.log("a1: "+a1+" P: "+dirpushed+firstdirpushed);
				if(dirpushed && firstdirpushed)
				{
					arr2.pop();
					done = false;
				}else{
					// push it anyway if it is at first position or if there are more of them.
					arr2.push(a1);
				}
				dirpushed=false;
			}
		}
		arr=arr2;
	}
	
	dir="";
	for(var i=0;i<arr.length;i++)
		dir+=arr[i];
	
	if(dir!=longdir)
		log("Directory shortened: "+longdir+" to "+dir, LOG_DEBUG_VERBOSE);
	
	return dir;
}

// add a slash to the folder name if there is none.
function __addSlashIfNot(directoryName)
{
	var d = directoryName;
	if(d==null)
		d="";
	// add ending / if it is not there.
	if(d.length>=1)
	{
		lastChar = d[d.length-1];
		if(lastChar!='\\' && lastChar!='/')
			d+='/';
	}
	return d;
}

// log something.
// loglevels: 0: only user related stuff like crash errors and user information and such.
// 1 = 0 with errors
// 2 = 1 with warnings
// 3 = 2 with debug
// 4 = very much output, be aware.
const LOG_USER = 0;
const LOG_ERROR = 1;
const LOG_WARN = 2;
const LOG_DEBUG = 3;
const LOG_DEBUG_VERBOSE = 4

var log = function(text, loglevel = 0)
{
	if(log.loglevel>=loglevel)
	{
		var ll="";
		switch(loglevel)
		{
			//case LOG_USER: ll="";break;
			case LOG_ERROR: ll='[<span class="jBashError">ERROR</span>]&gt; ';break;
			case LOG_WARN: ll='[<span class="jBashWarning">WARNING</span>]&gt; ';break;
			case LOG_DEBUG:
			case LOG_DEBUG_VERBOSE:
				ll='[<span class="jBashCmd">DEBUG</span>]&gt; ';break;
			default: break;
		}
		console.log("> "+text);
		jBash.instance.AddLine(ll+text);
	}
};
log.loglevel = LOG_DEBUG;

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// a sound file in the giml system.
var GIMLsound = function()
{
	var me = this;
	var m_soundFile ="";
	var m_internName = "";
	var m_folder = "";
	var m_audio = null;
	
	this.getIntern = function() {return m_internName;};
	this.parseGML=function(gmlSound, rootPath="")
	{
		m_folder=__addSlashIfNot(rootPath);
				
		if(__defined(gmlSound['FILE']))
			m_soundFile=gmlSound['FILE'];
		if(__defined(gmlSound['FOLDER']))
			m_folder=__shortenDirectory(m_folder+gmlSound['FOLDER']);
		m_folder=__addSlashIfNot(m_folder);
		if(__defined(gmlSound['INTERN']))
			m_internName = gmlSound['INTERN'];
		var i2 =m_internName.split(' ').join('_');
		if(i2!=m_internName)
		{
			log("Spaces are not allowed in intern names. [Sound]['"+m_internName+"' ==&gt; '"+i2+"']", LOG_WARN);
			m_internName = i2;
		}
		
		log("SND PATH: "+m_folder+m_soundFile);
	};
	
	// play the sound. if it is not loaded yet, load it before.
	this.playSound = function()
	{
		if(m_audio==null)
		{
			m_audio=new Audio(m_folder+m_soundFile);
			log("Audio loaded for '"+m_internName+"' ==&gt; "+m_folder+m_soundFile);
		}
		
		if(m_audio!=null)
		{
			m_audio.pause();
			m_audio.currentTime = 0;
			m_audio.play();
		}
	};
	
	this.debug = function(loglevel = LOG_DEBUG)
	{
		log("SOUND: "+m_internName+" --> "+m_soundFile, loglevel);
	}
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// an item in the giml system.
var GIMLitem = function()
{
	var me = this;
	var m_id = GIMLitem.getNewID(); // unique ID used for DOM processing.
	var m_isPickable = false;		// pickable not used yet.
	this.setPickable = function(pickable) {m_isPickable = pickable;};
	var m_posX = 0;
	var m_posY = 0;
	var m_posZ = 10; // pos z is the z index.
	var m_posLocation = "";	// the location where the item is placed.
	this.getLocationIntern = function() {return m_posLocation;}
	var m_imageFile = "";	  // the visible image for this item.
				  // if none is set, it will take the size of the collision image.
	var m_overImageFile = ""; // mouse over image.
	var m_clickSound = "";		// intern name of the sound to play when clicked.

	var m_collisionImageFile = "";	
	var m_collisionDataContext = null; // the collision image pixel data.
	var m_collisionWidth = 0;
	var m_collisionHeight = 0;
	var m_collisionScaleFactor = 1.0; // scale factor for collision including world factor,
					  // please reset after each get.

	var m_internName = "";
	this.getIntern = function() {return m_internName;};
	var m_itemName = "";
	var m_description = "";
	var m_folder = "";
	var m_scaleFactor = 1.0;
	var m_script_click = "";

	var m_myDiv = null;

	// if this is false, no further processing will be done on mouseover.
	var m_CollisionLoaded = false;
	this.isCollisionLoaded =function() {return m_CollisionLoaded;};
	
	// get world scale factor.
	this.getScaleFactor=function(outerScaleFactor=1.0) 
	{
		m_collisionScaleFactor = m_scaleFactor * outerScaleFactor;
		return m_collisionScaleFactor;
	}
	
	//this.setImage=function(imageName) {m_imageFile = imageName;}
	this.showName = function(evt)
	{
		var d=$('#gimli-text-description');
		d.css('top', evt.clientY-20);
		d.css('left', evt.clientX-(d.width()*0.5));
		d.css('pointer-events', 'none');
		d.html(m_itemName);
		if(m_itemName.length>0)
			d.show();
		else
			d.hide();
	}
	
	// get the dom element for this item.
	this.getDOMElement = function(rootdirectory="", outerscalefactor = 1.0) 
	{
		m_myDiv = null;
		m_CollisionLoaded = false;

		var sc = me.getScaleFactor(outerscalefactor);

		rootdirectory=__addSlashIfNot(rootdirectory);
		var path = __shortenDirectory(rootdirectory+m_folder+m_imageFile);
		var overpath = __shortenDirectory(rootdirectory+m_folder+m_overImageFile);
		var collisionpath = __shortenDirectory(rootdirectory+m_folder+m_collisionImageFile);
		var divel = jQuery.getNewDiv('','item_'+m_id,'gimli-item');
		
		var txt = '';
		// maybe there is no main image (transparent, open doors or alike)
		if(m_imageFile!="@ IMAGE not found. @")
			txt='<img src="'+path+'" id="item_image_'+m_id+'" class="gimli-image" />';
		// maybe there is no mouseover image (hidden items only need a collision image.)
		if(m_overImageFile!="@ IMAGE not found. @")
			txt+='<img src="'+overpath+'" id="item_image_over_'+m_id+'" class="gimli-image" style="display:none;">';

		divel.css('top', m_posY+'px');
		divel.css('left', m_posX+'px');
		divel.css('z-index', m_posZ);
		
		//divel.css('border', '1px solid #FF0000');
		divel.html(txt);

		// get the size of the collision image and set the divs size to it.
		var colimg = new Image();
		colimg.onload = function()
		{
			// width and height.
			var width = this.naturalWidth;
			var height = this.naturalHeight;
			
			// scale the div.
			divel.width(width*sc);
			divel.height(height*sc);

			// create the canvas for the image and render it to it.
			var canvas = document.createElement('canvas');
			var context = canvas.getContext('2d');
			//var img = document.getElementById('myimg');
			canvas.width = colimg.naturalWidth+1;
			canvas.height = colimg.naturalHeight+1;
			context.drawImage(colimg, 0, 0 );
			m_collisionDataContext = context;
			m_collisionWidth = width;
			m_collisionHeight = height;
			m_CollisionLoaded = true;
		}
		colimg.src = collisionpath;
		m_myDiv = divel;		
		return divel;
	};
	
	// do something when the item is clicked.
	this.click=function(evt) 
	{
		GIMLI.playSound(m_clickSound);
		if(m_script_click.length>0 && m_script_click!=parseInt(m_script_click))
		{
			jBash.Parse(m_script_click);
		}
	};

	// show debug information.
	this.debug=function(loglevel=LOG_DEBUG) {
		log("* Item '"+m_itemName+"' (intern: '"+m_internName+"')", loglevel);
		log(" --&gt; resides in '"+m_folder+"'", loglevel);
		log(" --&gt; Image: '"+m_imageFile+"'", loglevel);
		log(" --&gt; Collision: '"+m_collisionImageFile+"'", loglevel);
		log(" --&gt; Mouseover: '"+m_overImageFile+"'", loglevel);
		log(" --&gt; Clicksound: '"+m_clickSound+"'", loglevel);
		log(" --&gt; Loc./Room: ['"+m_posLocation+"', "+m_posX+", "+m_posY+"]", loglevel);
		log(" ", loglevel);
	};
	
	// check if the mouse is over an item and show the appropiate image.
	var __checkMouseOver = function(evt)
	{
		// if the pixel is set, show the mouseover image.
		if(__checkForPixel(evt))
		{
			$('#item_image_'+m_id).hide();
			$('#item_image_over_'+m_id).show();
			//$('#item_'+m_id).css('cursor', 'pointer');
			return true;
		}else{
			$('#item_image_over_'+m_id).hide();
			$('#item_image_'+m_id).show();
			//$('#item_'+m_id).css('cursor', 'auto');
			//evt.preventDefault();
		}
		return false;
	};

	// check if the mouse collides with the image or not.
	var __checkForPixel=function(evt) 
	{
		// get mouse position related to this item.
		var pos   = m_myDiv.offset();
	      	var elPos = { X:pos.left , Y:pos.top };
	      	var mPos  = { X:evt.clientX-elPos.X, Y:evt.clientY-elPos.Y };
		var mPosInt = { X:parseInt(mPos.X*1.0/m_collisionScaleFactor), Y:parseInt(mPos.Y*1.0/m_collisionScaleFactor) };
		
		// it does not collide when it is not on the area.
		if(mPosInt.X>=0 && mPosInt.Y>=0 && mPosInt.X<m_collisionWidth && mPosInt.Y<m_collisionHeight)
		{
			var pixelData=m_collisionDataContext.getImageData(mPosInt.X,mPosInt.Y,1,1).data;
			// check if the alpha value is > 0. Alpha is the third entry.
			if(pixelData[3]>0)
				return true;
		}
		return false;
	};
	
	// load in the values for the ITEM from the json array.
	this.parseGML=function(gmlItem, rootPath="")
	{
		m_itemName = gmlItem['NAME'];
		m_internName = gmlItem['INTERN'];
		m_folder = __addSlashIfNot(rootPath);
		m_description = gmlItem['DESCRIPTION'];	// description not used yet.
		m_imageFile = "@ IMAGE not found. @";//gmlItem['IMAGE'];
		m_overImageFile = "";//gmlItem['OVERIMAGE'];
		m_collisionImageFile = "";// gmlItem['COLLISIONIMAGE'];
		m_posLocation = "";
		m_script_click = "";

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
		var location = [];
		if(__defined(gmlItem['LOCATION']))
			location = gmlItem['LOCATION'];
		if(__defined(gmlItem['ROOM']))
			location = gmlItem['ROOM'];
		if(location.length>0)
		{
			var loc = location[0];
			var loc2 =loc.split(' ').join('_');
			if(loc!=loc2)
				log("Spaces are not allowed in intern names. [Item-Location]['"+loc+"' ==&gt; '"+loc2+"'] in location for item '"+m_internName+"'.", LOG_WARN);
			m_posLocation = loc2;
		}
		if(location.length>1)
			m_posX = parseInt(location[1]);
		if(location.length>2)
			m_posY = parseInt(location[2]);
		
		// check if the json has the entries.
		if(!__defined(gmlItem['NAME']))
			m_itemName = "@ NAME not found @";
		// check for the folder.
		if(__defined(gmlItem['FOLDER']))
			m_folder = __shortenDirectory(m_folder+gmlItem['FOLDER']);
		m_folder=__addSlashIfNot(m_folder);

		if(!__defined(gmlItem['DESCRIPTION']))
			m_description = "";
		if(__defined(gmlItem['IMAGE']))
			m_imageFile = gmlItem['IMAGE'];
		if(__defined(gmlItem['OVERIMAGE']))
			m_overImageFile = gmlItem['OVERIMAGE'];
		else
			m_overImageFile = m_imageFile;
		// get the collision image file name.	
		if(__defined(gmlItem['COLLISIONIMAGE']))
			m_collisionImageFile = gmlItem['COLLISIONIMAGE'];
		if(__defined(gmlItem['COLLISION']))
			m_collisionImageFile = gmlItem['COLLISION'];
		// if there is no collision image, take another one.
		if(!__defined(gmlItem['COLLISIONIMAGE']) && !__defined(gmlItem['COLLISION']))
		{
			if(m_imageFile!="@ IMAGE not found. @") // take the main image if there is one
				m_collisionImageFile = m_imageFile;
			else
				m_collisionImageFile = m_overImageFile;	// as last solution, take the mouseover image.
		}

		if(__defined(gmlItem['SCALEFACTOR']))	// get item scale.
			m_scaleFactor=parseFloat(gmlItem['SCALEFACTOR']);
		if(__defined(gmlItem['SCALE']))	// get item scale 2.
			m_scaleFactor=parseFloat(gmlItem['SCALE']);
		// get the click event.
		if(__defined(gmlItem['SCRIPT'])) // script happens on click, but onclick is preferred.
			m_script_click = gmlItem['SCRIPT'];
		if(__defined(gmlItem['ONCLICK']))
			m_script_click = gmlItem['ONCLICK'];
		// get the sound to play when the item is clicked.
		if(__defined(gmlItem['SOUND']))
			m_clickSound = gmlItem['SOUND'];
		var cs2 = m_clickSound.split(' ').join('_');
		if(m_clickSound!=cs2)
		{
			log("Spaces are not allowed in intern names. [Item-Clicksound]['"+m_clickSound+"' ==&gt; '"+cs2+"']", LOG_WARN);
			m_clickSound = cs2;
		}
	};
	
	// add this item to a room div.
	this.addToRoomDiv=function(div, rootdirectory="", outerscalefactor = 1.0)
	{
		log("Placing the item '"+m_internName+"' in the room...", LOG_DEBUG);
		var myElement = me.getDOMElement(rootdirectory, outerscalefactor);
		div.append(myElement);		
	};
	
	// check if the mouse is over this item.
	this.isMouseOver = function(evt) {return __checkMouseOver(evt);};
};

// get an unique id for each item.
GIMLitem.g_nextItemID = 0;
GIMLitem.getNewID = function()
{
	var id = GIMLitem.g_nextItemID;
	GIMLitem.g_nextItemID+=1;
	return id;
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// a room in the giml system.
var GIMLroom = function()
{
	var me = this;
	var m_roomName ="";
	var m_internName = "";
	this.getIntern = function() {return m_internName;};
	var m_bgImageFile = "";
	var m_folder = "";
	var m_scaleFactor = 1.0;
	this.setScaleFactor=function(scaleFactor) {m_scaleFactor = scaleFactor;}
	this.getScaleFactor=function(outerScaleFactor=1.0) {return m_scaleFactor*outerScaleFactor;}
		
	// return the image file including the path.
	this.getBGimagePath=function() {return m_folder+m_bgImageFile;};
	
	// parse the gml of a ROOM.
	this.parseGML=function(gmlRoom, rootPath="")
	{
		me.setScaleFactor(1.0);
		m_roomName = gmlRoom['NAME'];
		m_internName = gmlRoom['INTERN'];
		m_bgImageFile = "@ BGIMAGE not found. @";
		m_folder = __addSlashIfNot(rootPath);
		
		// check if the json has the entries.
		if(!__defined(m_roomName))
			m_roomName = "@ NAME not found @";
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
			m_folder = __shortenDirectory(m_folder+gmlRoom['FOLDER']);
		m_folder=__addSlashIfNot(m_folder);
		
		if(__defined(gmlRoom['BGIMAGE']))
			m_bgImageFile = gmlRoom['BGIMAGE'];
		// set the room scale factor.
		//room.setScaleFactor(m_scaleFactor); // set global scale. 0.0.29: multiply instead of or-ing.
		if(__defined(gmlRoom['SCALEFACTOR']))	// get room scale.
			me.setScaleFactor(parseFloat(gmlRoom['SCALEFACTOR']));
		if(__defined(gmlRoom['SCALE']))	// get room scale 2.
			me.setScaleFactor(parseFloat(gmlRoom['SCALE']));
	};
	
	this.debug=function(loglevel=LOG_DEBUG) {
		log("* Room '<span class='jBashCmd'>"+m_roomName+"</span>' (intern: '<span class='jBashCmd'>"+m_internName+"</span>')", loglevel);
		log(" --&gt; resides in '"+m_folder+"'", loglevel);
		log(" --&gt; bgImage: '"+m_bgImageFile+"'", loglevel);
		log(" ", loglevel);
	};
};

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// a GML url has a forepart with the initial directory (all images will be loaded from that point)
// and a back part with the actual site filename.
var GMLurl = function(filename)
{
	var me = this;
	var m_directory = "";
	var m_filename = "";
	this.getDirectory = function() {return m_directory;}
	this.getFilename = function() {return m_filename;}
	this.getCombined = function() {return m_directory+m_filename;}
	
	// create the actual stuff and maybe overwrite the old one.
	// check if the file has gml ending or add it.
	this.makeGMURL = function(gmurl)
	{
		var r = gmurl;
		var addending = ".gml";
		console.log(r);
		// if length is < 4 it does not have the right endings at all.
		if(r.length<=4)
		{
			r+=addending;
		}else{
			var e = r.substr(r.length - 4)
			switch(e.toLowerCase())
			{
				case ".gml":
				case "giml":
					break;
				default:
					r+=addending;
			}
		}
		
		// regex from the internets
		m_directory = r.match(/(.*)[\/\\]/); //[1]||'';
		if(m_directory==null) 
			m_directory ="";
		else
			m_directory = m_directory[1]||'';
		
		if(m_directory!="") m_directory+='/';
		m_filename = r.replace(/^.*[\\\/]/, '');

		log("MakeGMLUrl: "+gmurl,LOG_DEBUG)
		log(" --&gt; Directory: "+m_directory, LOG_DEBUG_VERBOSE);
		log(" --&gt; Filename : "+m_filename, LOG_DEBUG_VERBOSE);
		return me;
	};
	
	// initialize the stuff.
	me.makeGMURL(filename);
	return this;
}
GMLurl.makeGMURL = function(filename)
{
	var gmurl = new GMLurl(filename);
	return gmurl;
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/*******************************************************************************************************************************************************************/
// The GIML-Interpreter
var GIMLI = function()
{
	var me = this; // protect this from be this'ed from something other inside some brackets.
	
	var m_GMURL_initpage = "";  // the gml file which was called on the init function.
	var m_actualRoomIntern = "@ STARTLOCATION/STARTROOM not found. @"; // the actual room intern name.
	var m_startRoomIntern = "@ STARTLOCATION/STARTROOM not found. @"; // the start room intern name.
	var m_actualRoomX = 0;
	var m_actualRoomY = 0;
	var m_roomsLoaded = [];		// the rooms (locations) loaded with the gml file.
	var m_itemsLoaded = [];		// the items loaaded with the gml file.
	var m_loadedGMLFiles = [];	// list with all the GML files which were loaeded.
	var m_soundsLoaded = [];
	
	// scrolling variables.
	var m_scrollXDir = 0;
	var m_scrollYDir = 0;
	var m_scrollStep = 5;
	var m_isScrolling = false;
	var m_scrollingEnabled = true; // disable scrolling when the console is over.
	//  the scroll boundaries.
	var m_scrollBoundarX1 = 0;
	var m_scrollBoundarY2 = 0;
	var m_scrollBoundarX2 = 0;
	var m_scrollBoundarY2 = 0;
	
	// the size factor. usually 1 or 2
	var m_scaleFactor = 1.0;

// THIS IS THE MAIN GML FUNCTION SO FAR
	
	// load a gml json file.
	this.parseGML = function(json, rootPath = "")
	{
		log("Parsing GML [Path: "+rootPath+"]:"/*+JSON.stringify(json)*/, LOG_DEBUG);
		
		log("Converting array names to uppercase..", LOG_DEBUG_VERBOSE);
		var json2 = __jsonUpperCase(json);
		json = json2;
		
		// get additional gml files.
		var gmlArray = [];
		if(__defined(json['GMLS']))
			gmlArray = json['GMLS'];
		
		// get the start room. (StartLocation or StartRoom)
//TODO: remove that line below.
//		m_actualRoomIntern = m_startRoomIntern = "@ STARTLOCATION/STARTROOM not found. @";
		if(__defined(json['STARTLOCATION']))
			m_actualRoomIntern = m_startRoomIntern = json['STARTLOCATION'];
		if(__defined(json['STARTROOM']))
			m_actualRoomIntern = m_startRoomIntern = json['STARTROOM'];
		
		// get the global scale factor.
		if(__defined(json['SCALEFACTOR']))
			m_scaleFactor = parseFloat(json['SCALEFACTOR']);
		if(__defined(json['SCALE']))
			m_scaleFactor = parseFloat(json['SCALE']);
		
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
		
		//log("GML start room: "+m_startRoomIntern, LOG_USER);
		//log("General GML scale factor: "+parseFloat(m_scaleFactor), LOG_USER);
		
		// load in the rooms.
		if(roomArray.length>0)
		{
			for(var i = 0;i<roomArray.length;i++)
			{
				var jroom = roomArray[i];
				var room = new GIMLroom();
				room.parseGML(jroom, rootPath);
				m_roomsLoaded.push(room);
				room.debug(LOG_DEBUG_VERBOSE);
			}
		}else{
			log("No rooms defined in the given GML file.", LOG_WARN);
		}
		
		// load in the items.
		if(__defined(json['ITEMS']))
		{
			var itemArray = json['ITEMS'];
			for(var i = 0;i<itemArray.length;i++)
			{
				var jitem = itemArray[i];
				var item = new GIMLitem();
				item.parseGML(jitem, rootPath);
				m_itemsLoaded.push(item);
				item.debug(LOG_DEBUG_VERBOSE);
			}
		}else{
			log("No items defined in the given GML file.", LOG_WARN);
		}
		
		// load in sounds.
		if(__defined(json['SOUNDS']))
		{
			var soundArray = json['SOUNDS'];
			for(var i=0;i<soundArray.length;i++)
			{
				var sound=soundArray[i];
				var snd = new GIMLsound();
				// we need to include the project path here instead of "jump to room".
				snd.parseGML(sound, __shortenDirectory(__addSlashIfNot(m_GMURL_initpage.getDirectory())+rootPath));
				m_soundsLoaded.push(snd);
				snd.debug(LOG_DEBUG_VERBOSE);
			}
		}
		
		//log(__roomCount()+ " rooms loaded.",LOG_USER);
		//log(__itemCount()+" items loaded.", LOG_USER);
		//log(__soundCount()+" sounds loaded.",LOG_USER);
		
		// load the additional gml files recursively and one after each other.
		__recursiveload(gmlArray,0, rootPath);
	};

	// load all the gml files recursively.
	var __recursiveload = function(gmlArray, actual_i, rootPath ="")
	{
		if(gmlArray.length>actual_i)
		{
			var url = GMLurl.makeGMURL(m_GMURL_initpage.getDirectory()+rootPath+gmlArray[actual_i]);
			var all = __shortenDirectory(url.getCombined());
			var path = __shortenDirectory(url.getDirectory());
			
			// get the relative path to add to the json entries.			
			var relativePath = __shortenDirectory(GMLurl.makeGMURL(rootPath+gmlArray[actual_i]).getDirectory());
			if(!__isGMLFileLoaded(all))
			{
				log("Additional GIML file to load: "+all);
				// file is not laoded, get it and then load the next one.
				me.loadJSONFile(all, function(json) 
				{
					// TODO: remove ../ and predessing dir from all so that different dirs to the same file will be the same.
					m_loadedGMLFiles.push(all);
					me.parseGML(json, relativePath);
					__recursiveload(gmlArray,actual_i+1,rootPath);
				});
			}else{
				// file is already loaded, get the next one.
				log("File "+gmlArray[actual_i]+" already loaded.", LOG_WARN);
				__recursiveload(gmlArray,actual_i+1, rootPath);
			}
		}		
	}

// ENDOF GML PARSER
// JUMP FUNCTION *********************************************************************************************************************

// this is the second main function:  It loads a room and its items and shows it in the window.
	var m_actualRoomItems = [];	// all the items in the actual room, used for mouseover processing.
	this.jumpToRoom=function(roomInternName)
	{
		var room = __findRoom(roomInternName);
		if(room==null)
		{
			log("Room '"+roomInternName+"' not found. No jump done.", LOG_ERROR);
			return;
		}
		
		// clear the actual room items.
		m_actualRoomItems = [];
		
		// hide the text above the mouse.
		$('#gimli-text-description').hide();
		
		m_actualRoomX = 0;
		m_actualRoomY = 0;
		log("Jumping to room '"+roomInternName+"'", LOG_USER);
		
		// get the divs with the size and the content.
		var outer = __getMiddleWindow();
		//var main = __getMainWindow();
		var newroom = jQuery.getNewDiv('','gimli-main-window','gimli-pixelperfect');
		
		// clear the main window.
		//main.html("");
		// get the background image path.
		var imgPath = __shortenDirectory(m_GMURL_initpage.getDirectory()+room.getBGimagePath());
		//log("--> Loading background: "+imgPath,LOG_DEBUG);
		
		// Search all items which are associated to this room.
		var count = 0;
		for(var i=0; i < __itemCount(); i++)
		{
			var itm = m_itemsLoaded[i];
			var intern = itm.getIntern();
			if(room.getIntern() == itm.getLocationIntern())
			{
				count++;
				itm.addToRoomDiv(newroom,m_GMURL_initpage.getDirectory(), room.getScaleFactor(m_scaleFactor));
				m_actualRoomItems.push(itm);
			}
		}
		log(count+" items are placed in this room.", LOG_USER);

		// get background size.
		var bgimg = new Image();
		bgimg.onload = function()
		{
			// reset scroll boundaries.
			m_scrollBoundarX1 = 0;
			m_scrollBoundarY1 = 0;
			m_scrollBoundarX2 = 0;
			m_scrollBoundarY2 = 0;
			// actual room position.
			var newRoomX = 0;
			var newRoomY = 0;
			
			// width and height.
			var bgwidth = this.width;
			var bgheight = this.height;
			var outerWidth = outer.width();
			var outerHeight = outer.height();
			//log("main: "+mainWidth+" "+mainHeight+" "+m_scaleFactor, LOG_DEBUG);
			
			// scale the bg.
			var scaledbgwidth = parseInt(bgwidth*room.getScaleFactor(m_scaleFactor));
			var scaledbgheight = parseInt(bgheight*room.getScaleFactor(m_scaleFactor));
						
			// set scroll boundaries.
			if(scaledbgwidth > outerWidth)
			{
				// bg width is bigger than screen.
				m_scrollBoundarX2 = outerWidth-scaledbgwidth;
			}else{
				// bg width is smaller than screen.
				var newRoomX = outerWidth*0.5 - scaledbgwidth*0.5;
				m_scrollBoundarX1 = newRoomX;
				m_scrollBoundarX2 = newRoomX;
			}
			if(scaledbgheight > outerHeight)
			{
				// bg height is bigger than screen.
				m_scrollBoundarY2 = outerHeight - scaledbgheight;
			}else{
				// bg height is smaller than screen.
				var newRoomY = outerHeight*0.5 - scaledbgheight*0.5;
				m_scrollBoundarY1 = newRoomY;
				m_scrollBoundarY2 = newRoomY;
			}
			
			newroom.css("background-image", "url('"+imgPath+"')");
			newroom.css("background-repeat", "no-repeat");	
			/* adjust sizes */
			newroom.width(scaledbgwidth);
			newroom.height(scaledbgheight);
			newroom.css('background-size', ''+scaledbgwidth+'px '+scaledbgheight+'px');
			
			me.setRoomPosition(newRoomX, newRoomY);
			log("Background '"+imgPath+"' loaded. [Size: "+scaledbgwidth+" "+scaledbgheight+" from "+bgwidth+" "+bgheight+"]" , LOG_DEBUG);
		}
		bgimg.src = imgPath;
		
		// switch to the new screen.
		outer.html("");
		outer.append(newroom);
	};
	
// ENDOF JUMP FUNCTION *********************************************************************************************************************
	
	// find a room (local). Return null if nothing found.
	var __findRoom = function(roomIntern)
	{
		for(var i=0;i<__roomCount();i++)
		{
			var r = m_roomsLoaded[i];
			if(r.getIntern()==roomIntern)
				return r;
		}
		return null;
	};
	
	// return and clear rooms and items.
	var __clearRooms = function() {m_roomsLoaded = [];};
	var __clearItems = function() {m_itemsLoaded = [];};
	var __roomCount = function() {return m_roomsLoaded.length;}
	var __itemCount = function() {return m_itemsLoaded.length;}
	var __soundCount = function() {return m_soundsLoaded.length;}
	
	var __isGMLFileLoaded = function(filepath)
	{
		for(var i=0;i<m_loadedGMLFiles.length;i++)
		{
			if(m_loadedGMLFiles[i] == filepath)
				return true;
		}
		return false;
	}
	
	// show debug info about the rooms.
	this.debugRooms = function()
	{
		if(__roomCount<=0)
		{
			log("There are no rooms loaded.", LOG_USER);
			return;
		}
		log(" ", LOG_USER);
		log("+++ <span class='jBashCmd'>SHOWING DATA FOR "+__roomCount()+" LOADED ROOMS.</span> +++", LOG_USER);
		for(var i=0;i<__roomCount();i++)
		{
			m_roomsLoaded[i].debug(LOG_USER);
		}
	}
	
	// show debug info about the items.
	this.debugItems = function()
	{
		if(__itemCount<=0)
		{
			log("There are no items loaded.", LOG_USER);
			return;
		}
		log(" ", LOG_USER);
		log("+++ <span class='jBashCmd'>SHOWING DATA FOR "+__itemCount()+" LOADED ITEMS.</span> +++", LOG_USER);
		for(var i=0;i<__itemCount();i++)
		{
			m_itemsLoaded[i].debug(LOG_USER);
		}
	}
	
	// initialize gimli with a gml-file.
	this.init = function(gmurl)
	{
		__createMainWindow();
		var checkurl = GMLurl.makeGMURL(gmurl);
		log("Loading "+checkurl.getCombined()+"...");
		me.loadJSONFile(checkurl.getCombined(), function(json) {
			m_GMURL_initpage = checkurl;
			// clear all preloaded stuff.
			__clearItems();
			__clearRooms();
			m_scaleFactor=1.0;

			// clear the loaded files array and push this filename.
			m_loadedGMLFiles = [];
			m_loadedGMLFiles.push(checkurl.getCombined());
			me.parseGML(json);
			me.jumpToStartRoom();
			// hide the console in front of the user. :)
			setTimeout(GIMLI.hideConsole,750);
		});
	};
	
	// jump to the start location of a gml file.
	this.jumpToStartRoom = function() {me.jumpToRoom(m_startRoomIntern);};
	
	// add some values to the room position.
	this.addRoomPosition=function(addX, addY) {me.setRoomPosition(m_actualRoomX+addX, m_actualRoomY+addY);};

	// set a position directly.
	this.setRoomPosition=function(setX, setY)
	{
		var mainWindow = __getMainWindow();
		m_actualRoomX = setX;
		m_actualRoomY = setY;
		mainWindow.css('left', ''+setX+'px');
		mainWindow.css('top', ''+setY+'px');
	};
	
	// scrolling function
	var m_lastMouseEvent = null;
	var m_scrollInterval = null;
	var __scroll = function(evt)
	{
		m_lastMouseEvent = evt;
		__realScroll();
	}
	
	// the real scroll function, will call itself when scrolling is on and determine itself, IF scrolling is on.
	var __realScroll = function()
	{
		// maybe disable scrolling.
		if(!m_scrollingEnabled)
		{
			if(m_scrollInterval!=null)
			{
				clearInterval(m_scrollInterval);
				m_scrollInterval = null;
			}
			return;
		}
		
		var evt = m_lastMouseEvent;
		// get the size of the main screen.
		var main = __getMainWindow();
		var outer = __getOuterWindow();
		var w = outer.width();		// get width of outer window.
		var h = outer.height();		// get height of outer window.
		var r = outer.get(0).getBoundingClientRect();
		var t = r.top;				// get top of main window.
		var l = r.left;				// get left of main window.
		var cx = evt.clientX-l;		// get mouse x relative to main window.
		var cy = evt.clientY-t;		// get mouse y relative to main window.
				
		// scrolling areas
		var minW = w*0.2;
		var maxW = w*0.2*4;
		var minH = h*0.2;
		var maxH = h*0.2*4;
		
		// check for mouse position.
		if(cx<=minW || cx>=maxW || cy<=minH || cy>=maxH)
		{
			m_isScrolling = true;
		}else
		{
			m_isScrolling = false;
		}
		
		// check if mouse is out of field.
		if(cx<=0 || cx>=w || cy<=0 || cy>=h) {m_isScrolling = false;}
		
		// set scroll directories.
		m_scrollXDir = 0;
		m_scrollYDir = 0;
		if(cx<=minW)
			m_scrollXDir = 1;
		if(cx>=maxW)
			m_scrollXDir = -1;
		if(cy<=minH)
			m_scrollYDir = 1;
		if(cy>=maxH)
			m_scrollYDir = -1;
						
		// repeat the scrolling.
		if(m_isScrolling)
		{
			m_actualRoomX +=m_scrollXDir*m_scrollStep;
			m_actualRoomY +=m_scrollYDir*m_scrollStep;
			
			/* constrain the positions. */
			if(m_actualRoomX>m_scrollBoundarX1)
				m_actualRoomX = m_scrollBoundarX1;
			if(m_actualRoomY>m_scrollBoundarY1)
				m_actualRoomY=m_scrollBoundarY1;
			
			if(m_actualRoomX<m_scrollBoundarX2)
				m_actualRoomX=m_scrollBoundarX2;
			if(m_actualRoomY<m_scrollBoundarY2)
				m_actualRoomY=m_scrollBoundarY2;	

			me.setRoomPosition(m_actualRoomX, m_actualRoomY);
			//log("Scroll: W"+w+" H"+h+" +x"+l+" +y"+t+" X"+cx+" Y"+cy, LOG_DEBUG);
			if(m_scrollInterval==null)
				m_scrollInterval=setInterval(__realScroll, 15);
		}else{
			if(m_scrollInterval!=null)
			{
				clearInterval(m_scrollInterval);
				m_scrollInterval = null;
			}
		}
	}
		
	// make all the array names in a json object upper case.
	var __jsonUpperCase=function(obj) {
		var key, upKey;
		for (key in obj) {
			if (obj.hasOwnProperty(key)) {
				upKey = key.toUpperCase();
				if (upKey !== key) {
					obj[upKey] = obj[key];
					delete(obj[key]);
				}
				// recurse
				if (typeof obj[upKey] === "object") {
					__jsonUpperCase(obj[upKey]);
				}
			}
		}
		return obj;
	}

	// Check if a file exists.
	this.loadJSONFile=function(urlToFile, successFunction)
	{
		// Make an ajax call without jquery so we can load jquery with this loader.
		var xhr = new XMLHttpRequest();
		xhr.onreadystatechange = function()
    	{
        	if (xhr.readyState === XMLHttpRequest.DONE)
			{
        		if (xhr.status === 200) 
				{
					var json=xhr.response;
					log("JSON from "+urlToFile+" loaded.", LOG_DEBUG);
					if(typeof(successFunction)==="function")
						successFunction(json);
        		} else {
					log("Could not load file "+urlToFile+" / XHR: "+xhr.status, LOG_ERROR);
				}
        	}
    	};
    	xhr.open("GET", urlToFile, true);
		xhr.responseType = "json";
    	xhr.send();
	}
	
	// get the main window and outer window.
	var __getMainWindow = function() {return $('#gimli-main-window');};	// gimli content
	var __getMiddleWindow = function() {return $('#gimli-middle-window');};	// where the gimli content is put into.
	var __getOuterWindow = function() {return $('#gimli-outer-window');};	// where console and middle window is put into.

	// create the div where the action goes. :)
	var __createMainWindow = function()
	{
		var body = $('body');
		var cssfile = 'css/gimli-base.css';
		var cssfile2="css/jbash-base.css"
		var css= '<link rel="stylesheet" type="text/css" href="'+cssfile+'">';
		var css2= '<link rel="stylesheet" type="text/css" href="'+cssfile2+'">';
		
		var outerwindow = jQuery.getNewDiv('', 'gimli-outer-window', 'gimli-pixelperfect');
		var middlewindow = jQuery.getNewDiv('','gimli-middle-window','gimli-pixelperfect');		
		var mainwindow = jQuery.getNewDiv('','gimli-main-window', 'gimli-pixelperfect');
		var descriptionwindow = jQuery.getNewDiv('','gimli-text-description','gimli-text');
		
		// new, v0.2.x: diashow window.
		var diashowwindow = jQuery.getNewDiv('','gimli-diashow-window', 'gimli-pixelperfect');
		
		var elconsole = jQuery.getNewDiv('','gimli-jbash-window', '');
		var elconsole_outer = jQuery.getNewDiv('', 'gimli-jbash-outer-window', '');
		var elhidebutton = jQuery.getNewJSButton('&#9049;', "GIMLI.hideConsole();", 'gimli-button-hide-console', 'gimli-jbash-button');
		var elhelpbutton = jQuery.getNewJSButton('&#8264;', "jBash.instance.DoLine('cmd');", 'gimli-button-help-console', 'gimli-jbash-button');
		var elclsbutton = jQuery.getNewJSButton('&#8709;', "jBash.instance.DoLine('cls');", 'gimli-button-cls-console', 'gimli-jbash-button');
		elconsole_outer.append(elconsole)
		elconsole_outer.append(elhidebutton);
		elconsole_outer.append(elclsbutton);
		elconsole_outer.append(elhelpbutton);
		middlewindow.append(mainwindow);
		outerwindow.append(middlewindow);
		outerwindow.append(elconsole_outer);
		//outerwindow.append(descriptionwindow);		

		// event function to go through all items and check if there is a mouse over.
		var mtouchover = function(evt)
		{
			var isover = null;
			var isloaded = true;
			for(var i = 0; i<m_actualRoomItems.length;i++)
			{
				var itm = m_actualRoomItems[i];
				if(!itm.isCollisionLoaded())
					isloaded = false;
				if(itm.isMouseOver(evt))
					isover=itm;
			}
			// maybe set another cursor.
			if(isover!=null)
			{
				outerwindow.css('cursor','pointer');
				isover.showName(evt);
			}else{
				outerwindow.css('cursor','auto');
				$('#gimli-text-description').hide();
			}
			
			// wait 50ms and redo if not all images are loaded.
			if(!isloaded)
				window.setTimeout(function() {mtouchover(evt);}, 50);
		};
				
		outerwindow.mousemove(mtouchover);
		outerwindow.on('touchstart',mtouchover);
		outerwindow.on('touchmove',mtouchover);
		outerwindow.on('touchend',mtouchover);
		
		// go through all items and check if there is a click.
		outerwindow.click(function(evt)
		{
			var clickedItem = null;
			for(var i = 0; i<m_actualRoomItems.length;i++)
			{
				var itm = m_actualRoomItems[i];
				if(itm.isMouseOver(evt))
					clickedItem = itm;
			}
			if(clickedItem!=null)
			{
				clickedItem.click(evt);
			}
			// TODO: Wait for loading of images.
			mtouchover(evt);
		});

		var t='<a href="https://github.com/ben0bi/GIMLI/">GIML-Interpreter</a> v'+GIMLIVERSION+' (JS-Version) by Benedict Jäggi in 2019&nbsp;|&nbsp;';
		t+='<a href="javascript:" onclick="GIMLI.showConsole();">console</a>&nbsp;|&nbsp;';
		t+='<a href="javascript:" onclick="GIMLI.showConsole();jBash.Parse(\'donate\');">donate</a>';
		var el2= jQuery.getNewDiv(t, 'gimli-footer-window', 'gimli-pixelperfect');
		jQuery.appendElementTo('head', css2);
		jQuery.appendElementTo('head', css);
		
		jQuery.appendElementTo('body', outerwindow);
		jQuery.appendElementTo('body', descriptionwindow); // description is on body for making it visible "everywhere".
		jQuery.appendElementTo('body', diashowwindow); // the dia show window.		
		jQuery.appendElementTo('body', el2);
		
		// initialize the console.
		jBash.initialize("#gimli-jbash-window", "");
		// parse the cmd-Command to show commands.
		jBash.instance.Parse("cmd");
		
/* Some event functions */	
		// apply mouseover to the body.
		/*var main = __getMainWindow();*/
		var body = $('body');
		body.mousemove(function(evt) {
			__scroll(evt);
		});
		body.mouseout(function(evt) {
			m_isScrolling = false;
		});
		
		// disable scrolling when jbash is on.
		var jb = $('#gimli-jbash-outer-window');
		jb.mouseover(function(evt) {m_scrollingEnabled=false;});
		jb.mouseout(function(evt) {m_scrollingEnabled=true;});
	}
	
	// show or hide the image view / main window.
	var __showDiashowWindow=function(show=true)
	{
		if(show)
		{
			$('#gimli-outer-window').hide();
			$('#gimli-diashow-window').show();
		}else{
			$('#gimli-diashow-window').hide();
			$('#gimli-outer-window').show();
		}
	}
	
	// play a sound from the sound bank.
	this.playSound = function(internName)
	{
		if(internName=='' || internName==null)
			return;
		
		for(var i=0;i<m_soundsLoaded.length;i++)
		{
			var s = m_soundsLoaded[i];
			if(s.getIntern()==internName)
			{
				s.playSound();
				return;
			}
		}
		log("Could not play sound '"+internName+"': Entry not found.", LOG_WARN); 
	}
};
GIMLI.instance = new GIMLI();

// Initialize the GIMLI engine.
GIMLI.init = function(gmurl) {GIMLI.instance.init(gmurl);};
GIMLI.playSound = function(soundname)
{
	GIMLI.instance.playSound(soundname);
}

// jump to another room (console command)
GIMLI.jump = function(params)
{
	var p = jBash.GP(params);
	var r = "";
	if(p!="")
	{
		r = p[0];
		if(r.toLowerCase()=="to" && p.length>1)
			r = p[1];
	}else{
		jBash.Parse("man jump");
		return;
	}
	GIMLI.instance.jumpToRoom(r);
};

// Hooks for the jBash instance.
jBash.registerCommand("rooms", "Show info about the loaded rooms.", function(params)
	{GIMLI.instance.debugRooms();});
jBash.registerCommand("items", "Show info about the loaded items.", function(params)
	{GIMLI.instance.debugItems();});
jBash.registerCommand("jump", "Jump to a given room (intern name)<br />E.g. {<span class='jBashCmd'>jump to garden</span>}", GIMLI.jump);
jBash.registerCommand("j", "Short for the <span class='jBashCmd'>jump</span> command.", GIMLI.jump, true);

// set or get the log level.
jBash.registerCommand("loglevel","Set or get the log level. The bigger, the more verbose. From 0 to 4. USER, ERROR, WARNING, DEBUG, VERBOSE.<br />E.g. {<span class='jBashCmd'>loglevel 3</span>}",
function(params)
{
	if(__defined(params[1]))
	{
		if(""+parseInt(params[1])!=params[1])
			log("<span class='jBashWarning'>Wrong parameter given.</span> Please use a number between 0 and 4 or nothing.", LOG_USER);
		log.loglevel = parseInt(params[1]);
		if(log.loglevel>LOG_DEBUG_VERBOSE)
			log.loglevel = LOG_DEBUG_VERBOSE;
		if(log.loglevel < 0)
			log.loglevel = 0;
		log("Log level set to <span class='jBashCmd'>"+log.loglevel+"</span>.", LOG_USER);
	}else{
		log("Log level is <span class='jBashCmd'>"+log.loglevel+"</span>",LOG_USER);
	}
});

/* FUNCTIONS to Show and hide the console. */
GIMLI.hideConsole = function()  {__hideGIMLIconsole();}
GIMLI.showConsole = function() {__showGIMLIconsole();}

// hide the gimli console.
function __hideGIMLIconsole()
{
	m___consoleDirection = -1;
	m___consoleInterval=setInterval(__GIMLIconsoleMover,15);
}

// show the gimli console.
function __showGIMLIconsole()
{
	m___consoleDirection=2; // 2 to show window, 1 for moving only.
	m___consoleInterval=setInterval(__GIMLIconsoleMover,15);
}

// animation to show or hide the console.
var m___consoleDirection = 0;
var m___consoleInterval = null;
function __GIMLIconsoleMover()
{
	if(m___consoleDirection==0)
	{
		if(m___consoleInterval!=null)
			clearInterval(m___consoleInterval);
		m___consoleInterval=0;
		return;
	}
	
	var c = $('#gimli-jbash-outer-window');
	var t = parseInt(c.css('top'));

	// maybe show the window.
	if(m___consoleDirection==2)
	{
		c.show();
		jBash.instance.focus();
		m___consoleDirection = 1;
	}

	t = t + 10 * m___consoleDirection;

	if(t>=0 && m___consoleDirection>0)
	{
		t = 0;
		m___consoleDirection=0;
	}
	if(t < -c.height()-10 && m___consoleDirection<0)
	{
		c.hide();
		m___consoleDirection = 0;
	}
	c.css('top', t+'px');
}
