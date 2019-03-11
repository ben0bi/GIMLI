 /*

 ..............................................
 .                          GIMLI INTERPRETER .
 ..............................................
 . VERSION A : CLIENT JS                      .
 . by Benedict Jäggi                          .
 . Licensed under the                         .
 . GNU General Public License                 .
 . (see LICENSE file)                         .
 . NOT copying this work is prohibited :)     .
 ..............................................
 
 needs jQuery, BeJQuery and jBash.
 See the GIMLI-JSFILES.json in the config dir.
 
*/
const GIMLIVERSION = "0.0.24a";

// log something.
// loglevels: 0: only user related stuff like crash errors and user information and such.
// 1 = 0 with errors
// 2 = 1 with warnings
// 3 = 2 with debug
const LOG_USER = 0;
const LOG_ERROR = 1;
const LOG_WARN = 2;
const LOG_DEBUG = 3;
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
			case LOG_DEBUG: ll='[<span class="jBashCmd">DEBUG</span>]&gt; ';break;
			default: break;
		}
		console.log("> "+text);
		jBash.instance.AddLine(ll+text);
	}
};
log.loglevel = LOG_DEBUG;

// fetch a file and do some functions on it.	
/*async function asyncFetch(urlToFile, success, failure)
{
	await fetch(urlToFile).then(success, failure);
};*/

// an item in the giml system.
var GIMLitem = function()
{
	var m_isPickable = false;
	this.setPickable = function(pickable) {m_isPickable = pickable;};
	var m_posX = 0;
	var m_posY = 0;
	var m_posZ = 10; // pos z is the z index.
	var m_imageFile = "";
	var m_internName = "";
	var m_itemName = "";
	var m_Description = "";
	var m_folder = "";
	
	this.setImage=function(imageName) {m_imageFile = imageName;}
	this.getInitialHTML = function() 
	{
		return '<img src="'+m_imageFile+'" class="gimli-image" style="position: absolute; top: \''+posY+'px\'; left: \''+posX+'px\'; z-index: '+m_posZ+'>';
	};
	
	this.debug=function(loglevel=LOG_DEBUG) {
		log("* Item '"+m_itemName+"' (intern: '"+m_internName+"')", loglevel);
		log(" --&gt; resides in '"+m_folder+"'", loglevel);
		log(" --&gt; Image: '"+m_imageFile+"'", loglevel);
		log(" ", loglevel);
	};
};

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
	this.getScaleFactor=function(scaleFactor) {return m_scaleFactor;}
	
	this.set = function(roomName, roomInternalName, roomFolder, roomBGimageName)
	{
		m_roomName = roomName;
		m_internName = roomInternalName;
		m_bgImageFile = roomBGimageName;
		if(roomFolder==null)
			roomFolder="";
		// add ending / if it is not there.
		if(roomFolder.length>=1)
		{
			lastChar = roomFolder[roomFolder.length-1];
			if(lastChar!='\\' && lastChar!='/')
				roomFolder+='/';
		}
		m_folder = roomFolder;
	}
	
	// return the image file including the path.
	this.getBGimagePath=function() {return m_folder+m_bgImageFile;};
	
	this.debug=function(loglevel=LOG_DEBUG) {
		log("* Room '<span class='jBashCmd'>"+m_roomName+"</span>' (intern: '<span class='jBashCmd'>"+m_internName+"</span>')", loglevel);
		log(" --&gt; resides in '"+m_folder+"'", loglevel);
		log(" --&gt; bgImage: '"+m_bgImageFile+"'", loglevel);
		log(" ", loglevel);
	};
};

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
		log(" --&gt; Directory: "+m_directory, LOG_DEBUG);
		log(" --&gt; Filename : "+m_filename, LOG_DEBUG);
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

/*******************************************************************************************************************************************************************/
// The GIML-Interpreter
var GIMLI = function()                       
{
	var me = this; // protect this from be this'ed from something other inside some brackets.
	
	var m_GMURL_initpage = "";  // the gml file which was called on the init function.
	var m_actualRoomIntern = ""; // the actual room intern name.
	var m_startRoomIntern = ""; // the start room intern name.
	var m_actualRoomX = 0;
	var m_actualRoomY = 0;
	var m_roomsLoaded = [];		// the rooms (locations) loaded with the gml file.
	var m_itemsLoaded = [];		// the items loaaded with the gml file.
	
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
			me.parseGML(json);
			me.jumpToStartRoom();
			// hide the console in front of the user. :)
			setTimeout(GIMLI.hideConsole,750);
		});
	};
	
	// jump to the start location of a gml file.
	this.jumpToStartRoom = function() {me.jumpToRoom(m_startRoomIntern);};
	
	this.jumpToRoom=function(roomInternName)
	{
		var room = __findRoom(roomInternName);
		if(room==null)
		{
			log("Room '"+roomInternName+"' not found. No jump done.", LOG_ERROR);
			return;
		}
		m_actualRoomX = 0;
		m_actualRoomY = 0;
		log("Jumping to room '"+roomInternName+"'", LOG_USER);
		var main = __getMainWindow();
		var imgPath = m_GMURL_initpage.getDirectory()+room.getBGimagePath();
		
		//log("--> Loading background: "+imgPath,LOG_DEBUG);
		
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
			var mainWidth = main.width();
			var mainHeight = main.height();
			//log("main: "+mainWidth+" "+mainHeight+" "+m_scaleFactor, LOG_DEBUG);
			
			// scale the bg.
			var scaledbgwidth = parseInt(bgwidth*room.getScaleFactor());
			var scaledbgheight = parseInt(bgheight*room.getScaleFactor());
			
			// set scroll boundaries.
			if(scaledbgwidth > mainWidth)
			{
				// bg width is bigger than screen.
				m_scrollBoundarX2 = mainWidth-scaledbgwidth;
			}else{
				// bg width is smaller than screen.
				var newRoomX = mainWidth*0.5 - scaledbgwidth*0.5;
				m_scrollBoundarX1 = newRoomX;
				m_scrollBoundarX2 = newRoomX;
			}
			if(scaledbgheight > mainHeight)
			{
				// bg height is bigger than screen.
				m_scrollBoundarY2 = mainHeight - scaledbgheight;
			}else{
				// bg height is smaller than screen.
				var newRoomY = mainHeight*0.5 - scaledbgheight*0.5;
				m_scrollBoundarY1 = newRoomY;
				m_scrollBoundarY2 = newRoomY;
			}
			
			main.html("");
			main.css("background-image", "url('"+imgPath+"')");
			main.css("background-repeat", "no-repeat");
		
			/* adjust sizes */
			main.css('background-size', ''+scaledbgwidth+'px '+scaledbgheight+'px');
			var scale = parseInt(m_scaleFactor*100.0);
			/*$('.gimli-image').each(function(idx) 
			{
				$(this).css('width', ''+scale+'%');
				$(this).css('height', ''+scale+'%');			
			});*/
			me.setRoomPosition(newRoomX, newRoomY);
			log("Background '"+imgPath+"' loaded. [Size: "+scaledbgwidth+" "+scaledbgheight+" from "+bgheight+" "+bgwidth+"]" , LOG_DEBUG);
		}
		bgimg.src = imgPath;
	};
	
	// add some values to the room position.
	this.addRoomPosition=function(addX, addY) {me.setRoomPosition(m_actualRoomX+addX, m_actualRoomY+addY);};

	// set a position directly.
	this.setRoomPosition=function(setX, setY)
	{
		var mainWindow = __getMainWindow();
		m_actualRoomX = setX;
		m_actualRoomY = setY;
		mainWindow.css('background-position', ''+setX+'px '+setY+'px');
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
		main = __getMainWindow();
		var w = main.width();		// get width of main window.
		var h = main.height();		// get height of main window.
		var r = main.get(0).getBoundingClientRect();
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
	
	// load a gml json file.
	this.parseGML = function(json)
	{
		log("Parsing GML: "/*+JSON.stringify(json)*/, LOG_DEBUG);
		
		log("Converting array names to uppercase..", LOG_DEBUG);
		var json2 = __jsonUpperCase(json);
		json = json2;
		
		// get the start room. (StartLocation or StartRoom)
		m_actualRoomIntern = m_startRoomIntern = "@ STARTLOCATION/STARTROOM not found. @";
		
		if(__defined(json['STARTLOCATION']))
			m_actualRoomIntern = m_startRoomIntern = json['STARTLOCATION'];
		if(__defined(json['STARTROOM']))
			m_actualRoomIntern = m_startRoomIntern = json['STARTROOM'];
		
		// get the global scale factor.
		m_scaleFactor=1.0;
		if(__defined(json['SCALEFACTOR']))
			m_scaleFactor = parseFloat(json['SCALEFACTOR']);
		if(__defined(json['SCALE']))
			m_scaleFactor = parseFloat(json['SCALE']);
		
		// get locations (LOCATIONS or ROOMS)
		var roomArray = [];
		if(__defined(json['LOCATIONS']))
			roomArray = json['LOCATIONS'];
		if(__defined(json['ROOMS']))
			roomArray = json['ROOMS'];

		var itemArray = json['ITEMS'];
		
		log("GML start room: "+m_startRoomIntern, LOG_DEBUG);
		log("General GML scale factor: "+parseFloat(m_scaleFactor));
		
		// clear the rooms and items.
		__clearItems();
		__clearRooms();
		
		// fill the rooms and items.
		if(roomArray.length>0)
		{
			for(var i = 0;i<roomArray.length;i++)
			{
				var jroom = roomArray[i];
				var room = new GIMLroom();
				var name = jroom['NAME'];
				var intern=jroom['INTERN'];
				// replace spaces from intern name.
				var i2 = intern.split(' ').join('_');
				if(intern!=i2)
				{
					log("Spaces are not allowed in intern names. ['"+intern+"' ==&gt; '"+i2+"']", LOG_WARN);
					intern = i2;
				}
				var bgfile=jroom['BGIMAGE'];
				// check if the json has the entries.
				var folder = jroom['FOLDER'];
				if(!__defined(jroom['NAME']))
					name = "@ NAME not found @";
				if(!__defined(jroom['INTERN']))
					intern = "@ INTERN not found @";
				if(!__defined(jroom['FOLDER']))
					folder = "@ FOLDER not found @";
				if(!__defined(jroom['BGIMAGE']))
					bgfile = "@ BGIMAGE not found @";
				// set the room scale factor.
				room.setScaleFactor(m_scaleFactor); // set global scale.
				if(__defined(jroom['SCALEFACTOR']))	// get room scale.
					room.setScaleFactor(parseFloat(jroom['SCALEFACTOR']));
				if(__defined(jroom['SCALE']))	// get room scale 2.
					room.setScaleFactor(parseFloat(jroom['SCALEFACTOR']));

				room.set(name, intern, folder, bgfile);
				room.debug();
				m_roomsLoaded.push(room);
			}
		}else{
			log("No rooms defined in the given GML file.", LOG_WARN);
		}
		
		// load in the items.
		if(__defined(json['ITEMS']))
		{
			for(var i = 0;i<itemArray.length;i++)
			{
				var item = new GIMLitem();
				m_itemsLoaded.push(item);
				item.debug();
			}
		}else{
			log("No items defined in the given GML file.", LOG_WARN);
		}
		log(__roomCount()+ " rooms loaded.",LOG_USER);
		log(__itemCount()+" items loaded.", LOG_USER);
	};
	
	// check if a variable is defined or not.
	var __defined=function(variable)
	{
		if(typeof(variable)==="undefined")
			return false;
		return true;
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
	
	// get the main window
	var __getMainWindow = function() {return $('#gimli-main-window');};
	
	// create the div where the action goes. :)
	var __createMainWindow = function()
	{
		var body = $('body');
		var cssfile = 'css/gimli-base.css';
		var cssfile2="css/jbash-base.css"
		var css= '<link rel="stylesheet" type="text/css" href="'+cssfile+'">';
		var css2= '<link rel="stylesheet" type="text/css" href="'+cssfile2+'">';
		
		var outerwindow = jQuery.getNewDiv('', 'gimli-outer-window', 'gimli-pixelperfect');
		
		var mainwindow = jQuery.getNewDiv('','gimli-main-window', 'gimli-pixelperfect');
		
		var elconsole = jQuery.getNewDiv('','gimli-jbash-window', '');
		var elconsole_outer = jQuery.getNewDiv('', 'gimli-jbash-outer-window', '');
		var elhidebutton = jQuery.getNewJSButton('&#9049;', "GIMLI.hideConsole();", 'gimli-button-hide-console', 'gimli-jbash-button');
		var elhelpbutton = jQuery.getNewJSButton('&#8264;', "jBash.instance.DoLine('cmd');", 'gimli-button-help-console', 'gimli-jbash-button');
		var elclsbutton = jQuery.getNewJSButton('&#8709;', "jBash.instance.DoLine('cls');", 'gimli-button-cls-console', 'gimli-jbash-button');
		elconsole_outer.append(elconsole)
		elconsole_outer.append(elhidebutton);
		elconsole_outer.append(elclsbutton);
		elconsole_outer.append(elhelpbutton);
		outerwindow.append(mainwindow);
		outerwindow.append(elconsole_outer);
		
		var el2= jQuery.getNewDiv('<a href="https://github.com/ben0bi/GIMLI/">GIML-Interpreter</a> v'+GIMLIVERSION+' (JS-Version) by Benedict Jäggi in 2019 | <a href="javascript:" onclick="GIMLI.showConsole();">console</a>', 'gimli-footer-window', 'gimli-pixelperfect');
		jQuery.appendElementTo('head', css2);
		jQuery.appendElementTo('head', css);
		
		jQuery.appendElementTo('body', outerwindow);
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
/*		main.mouseover(function(evt) {
			__scroll(evt);
		});*/
		body.mouseout(function(evt) {
			m_isScrolling = false;
		});
		
		// disable scrolling when jbash is on.
		var jb = $('#gimli-jbash-outer-window');
		jb.mouseover(function(evt) {m_scrollingEnabled=false;});
		jb.mouseout(function(evt) {m_scrollingEnabled=true;});
	}
};
GIMLI.instance = new GIMLI();

// Initialize the GIMLI engine.
GIMLI.init = function(gmurl) {GIMLI.instance.init(gmurl);};

// Hooks for the jBash instance.
jBash.registerCommand("rooms", "Show info about the loaded rooms.", function(params)
	{GIMLI.instance.debugRooms();});
jBash.registerCommand("items", "Show info about the loaded items.", function(params)
	{GIMLI.instance.debugItems();});
jBash.registerCommand("jump", "Jump to a given room (intern name)<br />E.g. {<span class='jBashCmd'>jump garden</span>}", function(params) {GIMLI.instance.jumpToRoom(jBash.GP(params));});

/* FUNCTIONS to Show and hide the console. */
GIMLI.hideConsole = function()  {__hideGIMLIconsole();}
GIMLI.showConsole = function() {__showGIMLIconsole();}

function __hideGIMLIconsole()
{
	var c = $('#gimli-jbash-outer-window');
	var t = parseInt(c.css('top'));
	if(t > -(c.height()+10))
	{
		t=t-10;
		c.css('top', t+'px');
		setTimeout(__hideGIMLIconsole, 15);
	}else{
		c.hide();
	}
}

function __showGIMLIconsole()
{
	var c = $('#gimli-jbash-outer-window');
	var t = parseInt(c.css('top'));
	c.show();
	jBash.instance.focus();
	if(t < 0)
	{
		t=t+10;
		if(t>0) t=0;
		c.css('top', t+'px');
		setTimeout(__showGIMLIconsole, 15);
	}
}
