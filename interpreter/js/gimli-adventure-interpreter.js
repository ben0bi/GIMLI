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
 
 PROTOTYPE INTERPRETER in pure JavaScript
 Hopefully this will be included into Firefox
 or such, natively.

 needs jQuery and jBash.
 and pre-0.7.00 also needs behelpers.js and BeJQuery.js
 
 Also needs, since 0.6.10: gimli-parser.js and gimli-standard-parsers.js
 
 See the GIMLI-JSFILES.json in the config dir.
*/

const GIMLIVERSION = "0.7.03";

// Functions from BeJQuery.js

// append a jquery element (el) to other jquery element/s (id or class name).
jQuery.appendElementTo=function(contentIDorClass, jqElement)
{
	$(contentIDorClass).each(function() {$(this).append(jqElement);});
};

// create a new DOM element with given tagname, id and classes.
jQuery.getNewElement=function(tagname='div',id='', classes='')
{
	var el = $(document.createElement(tagname));
	if(id!='')
		el.attr('id', id);
	if(classes!='')
		el.attr('class', classes);
	return el;
};

// create a new div with given  content, id and classes.
jQuery.getNewDiv=function(content='',id='', classes='')
{
	var el = jQuery.getNewElement('div',id,classes);
	if(content!='')
		el.html(content);
	return el;
};

// create a new A tag with a normal href linking.
jQuery.getNewLink=function(url,text, id='',classes='')
{
	var el = jQuery.getNewElement('a',id,classes);
	$(el).attr('href',url);
	$(el).html(text);
	return el;
};

// create a new A tag which calls a JS function on click.
jQuery.getNewJSButton=function(buttonContent,jsFunctionName, id='',classes='')
{
	var el = jQuery.getNewLink('javascript:',buttonContent,id,classes);
	$(el).attr('onclick', jsFunctionName);
	return el;
};

// ENDOF BeJQuery.js

// ADD the standard parsers.
GMLParser.addParser("GLOBAL",new GMLParser_GLOBAL());
GMLParser.addParser("ROOMS", new GMLParser_ROOMS());
GMLParser.addParser("ITEMS", new GMLParser_ITEMS());
GMLParser.addParser("SOUNDS", new GMLParser_SOUNDS());
GMLParser.addParser("PANELS", new GMLParser_PANELS());

// some shorts.
GMLParser.GLOBALS = function() {return GMLParser.getParser("GLOBAL");};
GMLParser.ROOMS = function() {return GMLParser.getParser("ROOMS").rooms;};
GMLParser.ITEMS = function() {return GMLParser.getParser("ITEMS").items;};
GMLParser.SOUNDS = function() {return GMLParser.getParser("SOUNDS").sounds;};
GMLParser.PANELS = function() {return GMLParser.getParser("PANELS").panels;};

// eventually parse the given file and its sub-files.
//GMLParser.parseFile("myFile.file");

///////////////////////////////////////////////////////////////

// install log function.
log.loglevel = LOG_DEBUG;
log.logfunction = function(text, loglevel) 
{
	ll="";
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
	jBash.instance.AddLine(ll+text);
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// The GIML-Interpreter
var GIMLI = function()
{
	var me = this; // protect this from be this'ed from something other inside some brackets.
	
	var m_actualRoomX = 0;
	var m_actualRoomY = 0;
	
	// scrolling variables.
	var m_scrollXDir = 0;
	var m_scrollYDir = 0;
	var m_scrollStep = 5;
	var m_isScrolling = 0;	// 0 = no, 1 = mouse, 2 = keys
	var m_scrollingEnabled = true; // disable scrolling when the console is over.
	//  the scroll boundaries.
	var m_scrollBoundarX1 = 0;
	var m_scrollBoundarY2 = 0;
	var m_scrollBoundarX2 = 0;
	var m_scrollBoundarY2 = 0;
	
	// keys for scrolling.
	const KEY_LEFT= 37;
	const KEY_RIGHT = 39;
	const KEY_UP = 38;
	const KEY_DOWN = 40;
	
	// the last event fired when scrolling was enabled or disabled.
	var m_lastScrollEvent = null;
	// the function to call after the interval. either scroll_mouse or scroll_keys
	var m_scrollIntervalFunction = null;
	// are we scrolling with the keyboard or the mouse?
	var m_scrollWithKeys = false;
		
	this.debug=function(loglevel)
	{
		var globals = GMLParser.GLOBALS();
		var items = GMLParser.ITEMS();
		var rooms = GMLParser.ROOMS();
		var panels = GMLParser.PANELS();
		var sounds = GMLParser.SOUNDS();
		
		log("GML start room: "+globals.startRoomIntern, loglevel);
		log("General GML scale factor: "+parseFloat(globals.scaleFactor), loglevel);
		log(rooms.length+ " rooms loaded.",loglevel);
		log(items.length+" items loaded.", loglevel);
		log(sounds.length+" sounds loaded.",loglevel);
		log(panels.length+" text panels loaded.", loglevel);
	}

	var getDOMElement_ITEM = function(item, outerscalefactor = 1.0) 
	{
		item.myDiv = null;
		item.setCollisionLoaded(false);

		var sc = item.getScaleFactor(outerscalefactor);

		var path = __shortenDirectory(item.folder+item.imageFile);
		var overpath = __shortenDirectory(item.folder+item.overImageFile);
		var collisionpath = __shortenDirectory(item.folder+item.collisionImageFile);
				
		var divel = jQuery.getNewDiv('','item_'+item.getUniqueID(),'gimli-item');
		
		var txt = '';
		// maybe there is no main image (transparent, open doors or alike)
		if(item.imageFile!="@ IMAGE not found. @")
			txt='<img src="'+path+'" id="item_image_'+item.getUniqueID()+'" class="gimli-image" />';
		// maybe there is no mouseover image (hidden items only need a collision image.)
		if(item.overImageFile!="@ IMAGE not found. @")
			txt+='<img src="'+overpath+'" id="item_image_over_'+item.getUniqueID()+'" class="gimli-image" style="display:none;">';

		divel.css('top', item.posY+'px');
		divel.css('left', item.posX+'px');
		divel.css('z-index', item.posZ);
		
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
			// set the collision parameters.
			item.collisionDataContext = context;
			item.collisionWidth = width;
			item.collisionHeight = height;
			item.setCollisionLoaded(true);
		}
		colimg.src = collisionpath;
		item.myDiv = divel;
		return divel;
	};

// JUMP FUNCTION *********************************************************************************************************************

// this is the second main function:  It loads a room and its items and shows it in the window.
	var m_actualRoomItems = [];	// all the items in the actual room, used for mouseover processing.
	this.jumpToRoom=function(roomInternName,tox=0,toy=0)
	{
		var room = __findRoom(roomInternName);
		if(room==null)
		{
			log("Room '"+roomInternName+"' not found. No jump done.", LOG_ERROR);
			return;
		}
		
		// set the actual room intern name.
		var globals = GMLParser.GLOBALS();
		globals.actualRoomIntern=roomInternName;
		
		// show the blocker while it waits for the loading.
		GIMLI.showBlocker(true, "Jumping to room "+roomInternName);
		
		// clear the actual room items.
		m_actualRoomItems = [];
		
		// hide the text above the mouse.
		$('#gimli-text-description').hide();
		
		m_actualRoomX = 0;
		m_actualRoomY = 0;
		log("Jumping to room '"+roomInternName+"'", LOG_USER);
		
		// get the divs with the size and the content.
		var outer = __getMiddleWindow();
		// create a new main window.
		var newroom = jQuery.getNewDiv('','gimli-main-window','gimli-pixelperfect');

		// get the background image.
		var imgPath = __shortenDirectory(room.getBGimagePath());
		//log("--> Loading background: "+imgPath,LOG_DEBUG);
		
		// Search all items which are associated to this room.
		var count = 0;
		var itemsLoaded = GMLParser.ITEMS();
		for(var i=0; i < itemsLoaded.length; i++)
		{
			var itm = itemsLoaded[i];
			//var intern = itm.getIntern();
			if(room.getIntern() == itm.posLocation)
			{
				count++;
				//itm.addToRoomDiv(newroom, room.getScaleFactor(globals.scaleFactor));
				log("Placing the item '"+itm.getIntern()+"' in the room...", LOG_DEBUG);
				var myElement = getDOMElement_ITEM(itm, room.getScaleFactor(globals.scaleFactor));
				newroom.append(myElement);		
				m_actualRoomItems.push(itm);
			}
		}
		log(count+" items are placed in this room.", LOG_USER);

		GIMLI.showBlocker(true, "Loading room image..");
		// get background size.
		var bgimg = new Image();
		//0.5.06 : also hide blocker on error.
		// 0.6.11: do not hide blocker on error but show error message.
		bgimg.onerror = function() {GIMLI.showBlocker(true, "ERROR: Could not load room background image!", true);};//GIMLI.showBlocker(false);};
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
			
			// scale the bg.
			var scaledbgwidth = parseInt(bgwidth*room.getScaleFactor(globals.scaleFactor));
			var scaledbgheight = parseInt(bgheight*room.getScaleFactor(globals.scaleFactor));
						
			// set scroll boundaries.
			if(scaledbgwidth > outerWidth)
			{
				// bg width is bigger than screen.
				m_scrollBoundarX2 = outerWidth-scaledbgwidth;
			}else{
				// bg width is smaller than screen.
				newRoomX = outerWidth*0.5 - scaledbgwidth*0.5;
				m_scrollBoundarX1 = newRoomX;
				m_scrollBoundarX2 = newRoomX;
			}
			if(scaledbgheight > outerHeight)
			{
				// bg height is bigger than screen.
				m_scrollBoundarY2 = outerHeight - scaledbgheight;
			}else{
				// bg height is smaller than screen.
				newRoomY = outerHeight*0.5 - scaledbgheight*0.5;
				m_scrollBoundarY1 = newRoomY;
				m_scrollBoundarY2 = newRoomY;
			}
			
			newroom.css("background-image", "url('"+imgPath+"')");
			newroom.css("background-repeat", "no-repeat");	
			/* adjust sizes */
			newroom.width(scaledbgwidth);
			newroom.height(scaledbgheight);
			newroom.css('background-size', ''+scaledbgwidth+'px '+scaledbgheight+'px');
			
			// 0.3.04 : set room position from script.
			if(tox!=0)
			{
				if(tox<m_scrollBoundarX1) tox=m_scrollBoundarX1;
				if(tox>m_scrollBoundarX2) tox=m_scrollBoundarX2;
				newRoomX=tox;
			}
			if(toy!=0)
			{
				if(toy<m_scrollBoundarY1) tox=m_scrollBoundarY1;
				if(toy>m_scrollBoundarY2) tox=m_scrollBoundarY2;
				newRoomY=toy;
			}
			
			me.setRoomPosition(newRoomX, newRoomY);
			log("Background '"+imgPath+"' loaded. [Size: "+scaledbgwidth+" "+scaledbgheight+" from "+bgwidth+" "+bgheight+"]" , LOG_DEBUG);
			
			// hide the blocker.
			GIMLI.showBlocker(false);
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
		var rooms = GMLParser.ROOMS();
		for(var i=0;i<rooms.length;i++)
		{
			// 0.6.12 externalized
			var r = rooms[i];
			if(r.getIntern()==roomIntern)
				return r;
		}
		return null;
	};
	
	// return and clear rooms and items.
	var __clearRooms = function() {GMLParser.getParser("ROOMS").clear();/* NC m_roomsLoaded = [];*/};
	var __clearItems = function() {GMLParser.getParser("ITEMS").clear();};
	var __clearSounds = function() {GMLParser.getParser("SOUNDS").clear();};
	var __clearPanels = function() {GMLParser.getParser("PANELS").clear(); /* NC m_panelsLoaded = []; */};

	// initialize gimli with a gml-file.
	var m_roomByURL = "";
	this.init = function(gmurl)
	{	
		// create the main window, including the console.
		__createMainWindow();

		GIMLI.showBlocker(true, "Welcome to GIMLI");

		var checkurl = GMLurl.makeGMURL(__shortenDirectory(gmurl));

		// 0.5.17: clearing everything before loading the json.
		__clearItems();
		__clearRooms();
		__clearPanels();
		__clearSounds();

		m_roomByURL="";
		// get the url parameters.
		m_roomByURL=window.location.href;
		m_roomByURL = m_roomByURL.split("?");
		// get the room directly from the "first" parameter.
		if(m_roomByURL.length>1)
		{
			m_roomByURL=m_roomByURL[1];
		}else{
			m_roomByURL="";
		}
		
		if(m_roomByURL!="")
			log("Set room from URL to "+m_roomByURL+".", LOG_DEBUG);

		GIMLI.showBlocker(true, "Loading "+checkurl.getCombined()+"...");
		log("Loading "+checkurl.getCombined()+"...");

		// get all the data and do something with it.
		PARSEGMLFILE(checkurl.getCombined(), function() 
		{
			// load all the sounds.
			GIMLI.showBlocker(true, "Preloading the sounds...");
			log("Preloading the sounds...");
			var preloadsounds = function()
			{
				var sounds = GMLParser.SOUNDS();
				for(var i=0;i<sounds.length;i++)
				{
					var s=sounds[i];
					if(s.audio==null)
					{
						log("PRELOAD AUDIO "+i+" "+s.getIntern());
						s.audio=new Audio();
						s.audio.preload = "metadata";
						s.audio.addEventListener("loadedmetadata", function() 
						{
							s.duration = s.audio.duration;
							log("Audio loaded for '"+s.getIntern()+"' ==&gt; "+s.folder+s.soundFile);
						});
						s.audio.src=s.folder+s.soundFile;
						// preload the sounds as long as there may be another empty sound.
						preloadsounds();
						return;
					}
				}
			}
			preloadsounds();
			
			GIMLI.showBlocker(true, "Jumping to start room...");
			
			// 0.5.19: Doing the rest.
			if(m_roomByURL!="")
			{		
				// 0.5.22: check if the url room exists.
				var room = __findRoom(m_roomByURL);
				if(room==null)
				{
					log("Room ["+m_roomByURL+"] from URL not found!",LOG_WARN);
					log("Jumping to original start room ["+GMLParser.GLOBALS().startRoomIntern+"].", LOG_WARN);
					me.jumpToStartRoom();
				}else{
					me.jumpToRoom(m_roomByURL);
				}
			}else{
				me.jumpToStartRoom();
			}
			
			// hide the console after a while.
			setTimeout(GIMLI.hideConsole,750);
		});
	};
	
	// jump to the start location of a gml file.
	this.jumpToStartRoom = function() {me.jumpToRoom(GMLParser.GLOBALS().startRoomIntern);};
	
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
	
	// 0.5.08: unfocus all items.
	// 0.5.09: only in actual room.
	this.unfocusItems=function()
	{
		for(var i=0;i<m_actualRoomItems.length;i++)
		{
			var itm=m_actualRoomItems[i];
			showMouseOverImage_ITEM(itm,false);
		}
	}
	
	// 0.5.03: focus on an item. Jump to another room if it has one.
	this.focusItem=function(itemname,x="not",y="not")
	{
		// get the item.
		// 0.6.20: externalized items.
		var itemsLoaded = GMLParser.ITEMS();
		for(var i=0;i<itemsLoaded.length;i++)
		{
			var itm=itemsLoaded[i];
			if(itm.getIntern()==itemname)
			{
				var globals = GMLParser.GLOBALS();
				
				// jump to another room if the item is not here.
				var iloc=itm.posLocation;
				var interval = 1;
				if(iloc!=globals.actualRoomIntern)
				{
					interval=1000;
					log("Item '"+itemname+"' is in another room. Actual room is '"+globals.actualRoomIntern+"'. Jumping to room '"+iloc+"'..");
					jBash.Parse("jump to "+iloc);
				}
				
				// highlight the item.
				showMouseOverImage_ITEM(itm, true);
				var room = __findRoom(iloc);
				if(room==null)
				{
					log("Room '"+roomInternName+"' not found. Position not changed.", LOG_WARN);
					return;
				}
				
				// maybe set the room position.
				if(x!="not" && y!="not") {
					setTimeout(function(){
						// Todo: put that in setroomposition.
						if(x>m_scrollBoundarX1)
							x=m_srollBoundarX1;
						if(y>m_scrollBoundarY1)
							y=m_scrollBoundarY1;
						if(x<m_scrollBoundarX2)
							x=m_srollBoundarX2;
						if(y<m_scrollBoundarY2)
							y=m_scrollBoundarY2;
						//console.log("NOW! "+x+"/"+y);
						me.setRoomPosition(x,y);
					},interval);
				}
				return;
			}
		}
	}
	
	// the function to call in the events for mouse and keyboard.
	var __scroll = function(evt, iskb=false)
	{
		// do nothing if the mouse is stopped.
		if(GIMLI.stopMouse==true || GIMLI.panelActive==true)
			return;
		
		// maybe disable scrolling.
		if(!m_scrollingEnabled)
		{
			if(m_scrollIntervalFunction!=null)
			{
				clearInterval(m_scrollIntervalFunction);
				m_scrollIntervalFunction = null;
			}
			return;
		}

		// I really hope, the mouse params are also in a keyboard event...
		m_lastScrollEvent = evt;
		
		if(!iskb && !m_scrollWithKeys)
			__realScroll_mouse();
		else
			__realScroll_keys();
	}
	
	// stop the scrolling.
	var __stopScroll=function(evt, iskb=false)
	{
		if(!m_scrollWithKeys || iskb==true)
		{
			m_isScrolling = 0;
			m_scrollXDir=0;
			m_scrollYDir=0
		}
		
		if(m_scrollIntervalFunction!=null)
			clearInterval(m_scrollIntervalFunction);
		m_scrollIntervalFunction=null;
		m_scrollWithKeys=false;
	}

	// scroll process does the actual scrolling on the map,
	// with m_scrollStep as range.
	var __scrollProcess = function()
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
	}
	
	var __realScroll_keys = function()
	{
		var evt = m_lastScrollEvent;
		
		// check if it is a scroll key at all.
		switch(evt.keyCode)
		{
			case KEY_LEFT:
			case KEY_RIGHT:
			case KEY_UP:
			case KEY_DOWN:
				m_isScrolling = 2;
				m_scrollWithKeys = true;
				break;
			default: break;
		}
		
		// now we need to do that again, to determine the scroll directions.
		if(m_isScrolling==2)
		{
			// set scroll direction.
			switch(evt.keyCode)
			{
				case KEY_UP: m_scrollYDir = 1;break;
				case KEY_DOWN: m_scrollYDir = -1;break;
				case KEY_LEFT: m_scrollXDir = 1;break;
				case KEY_RIGHT: m_scrollXDir = -1;break;
				default: break;
			}
			// repeat the scrolling.
			if(m_isScrolling==2)
			{
				__scrollProcess();
				__mtouchover(m_lastMouseEvent);
				if(m_scrollIntervalFunction!=null)
					clearInterval(m_scrollIntervalFunction)
				m_scrollIntervalFunction=null; // for security, null it "again".
				m_scrollIntervalFunction=setInterval(__realScroll_keys, 10);
			}else{
				if(m_isScrolling==0)
				{
					if(m_scrollIntervalFunction!=null)
						clearInterval(m_scrollIntervalFunction);
					m_scrollIntervalFunction = null;
				}
			}
		}
	}
	
	// the real scroll function, will call itself when scrolling is on and determine itself, IF scrolling is on.
	var __realScroll_mouse = function()
	{
		// we are already scrolling with the keys, do no "mouseover"
		if(m_scrollWithKeys)
			return;
		
		var evt = m_lastScrollEvent;
		
		// the scroll event may be clear.
		if(evt==null)
			return;
		
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
		if(cx<=minW || cx>=maxW || cy<=minH || cy>=maxH) {
			m_isScrolling = 1;
		}else{
			m_isScrolling = 0;
		}
		
		// check if mouse is out of field.
		if(cx<=0 || cx>=w || cy<=0 || cy>=h) {m_isScrolling = 0;}

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
		if(m_isScrolling==1)
		{
			__scrollProcess();
			__mtouchover(evt);
			if(m_scrollIntervalFunction!=null)
				clearInterval(m_scrollIntervalFunction)
			m_scrollIntervalFunction=null; // for security, null it "again".
			m_scrollIntervalFunction=setInterval(__realScroll_mouse, 10);
		}else{
			if(m_isScrolling==0)
			{
				if(m_scrollIntervalFunction!=null)
					clearInterval(m_scrollIntervalFunction);
				m_scrollIntervalFunction = null;
			}
		}
	}
	
	// 0.6.34: onclick for panel buttons external from data structure.
	// the click function for this button.
	var m_actualClickPanelButton = null;
	var click_PANELBUTTON = function(btn, evt)
	{
		var duration = GIMLI.getSoundDuration(btn.clickSound);
		//log("SOUND DURATION: "+duration);
		duration = parseInt(duration*1000*btn.soundDelay + 1); // get in ms and add one ms.
		// (maybe) play the sound.
		GIMLI.playSound(btn.clickSound);
		// click after the sound has played.
		m_actualClickPanelButton = btn;
		setTimeout(__realClick_PANELBUTTON,duration);

		// do not click through!
		evt.stopPropagation();
		evt.preventDefault();
		evt.stopImmediatePropagation();
		return false;
	}
	var __realClick_PANELBUTTON = function()
	{
		if(m_actualClickPanelButton==null)
			return;
		var b = m_actualClickPanelButton; // short that shit. :)
		if(b.buttonFunctions.length>0)
		{
			// 0.4.01: array instead of single function.
			for(var btnfi=0;btnfi<b.buttonFunctions.length;btnfi++)
			{
				var line = b.buttonFunctions[btnfi];
				if(line!="")
					jBash.Parse(line);
			}
		}
		else
			log("This button has no function associated.", LOG_WARN);
		m_actualClickPanelButton = null; // reset the actual button.
	}

	// 0.6.34: getdomelement for panel buttons external from data structure.
	var getDOMElement_PANELBUTTON =function(btn)
	{
		var dom = jQuery.getNewDiv(btn.buttonText,'','gimli-panel-button gimli-pixelperfect');
		$(dom).on('click', function(evt) {log("BUTTON '"+btn.buttonText+"' clicked.",LOG_DEBUG); click_PANELBUTTON(btn,evt);});
		log("Adding button '"+btn.buttonText+"' to panel.", LOG_DEBUG_VERBOSE);
		return dom;
	};
	
	// 0.6.31: panel show command external from data structure.
	var display_PANEL = function(panel)
	{
		// stop the mouse action first.
		GIMLI.panelActive = true;
		
		var GIMLIwindow = GIMLI.instance.getOuterWindow();
		panel.panelDiv = jQuery.getNewDiv('','gimli-panel-'+panel.getIntern(), 'gimli-panel gimli-pixelperfect');
		
		// the div with the content in it.
		var contentDiv = jQuery.getNewDiv(panel.text,'','gimli-panel-contentdiv gimli-pixelperfect');
		// add the buttons.
		var buttonDiv = jQuery.getNewDiv('','','gimli-panel-buttondiv gimli-pixelperfect');
		for(var i=0;i<panel.buttons.length; i++)
		{
			var b=panel.buttons[i];
			var btnDiv = getDOMElement_PANELBUTTON(b);
			buttonDiv.append(btnDiv);
		}
		
		panel.panelDiv.append(contentDiv);
		panel.panelDiv.append(buttonDiv);
		GIMLIwindow.append(panel.panelDiv);

		// maybe adjust the height.
		if(panel.panelDiv.height() >= GIMLIwindow.height()-30)
		{
			var hc = parseInt(GIMLIwindow.height()*0.1*7.0)+'px';
			var hb = parseInt(GIMLIwindow.height()*0.1*3.0)+'px';
			contentDiv.css('max-height',hc);
			buttonDiv.css('max-height', hb);
			panel.panelDiv.css('max-height', GIMLIwindow.height()+'px');
			panel.panelDiv.css('top', '0px');
		}
	};
	
	// 0.3.19: show a specific panel.
	this.showPanel= function(internName)
	{
		// 0.6.31: data structure external from function structure.
		var panelsLoaded = GMLParser.PANELS();
		for(var i=0;i<panelsLoaded.length;i++)
		{
			var p = panelsLoaded[i];
			if(p.getIntern()==internName)
			{
			// NC	p.show();
				display_PANEL(p);
				return;
			}
		}
		log("Panel '"+internName+"' does not exist.", LOG_WARN);
	};
	
	// remove all panels from the dom.
	this.closeAllPanels=function()
	{
		var panels = document.getElementsByClassName('gimli-panel');
		while(panels[0])
		{
			panels[0].parentNode.removeChild(panels[0]);
		}
		GIMLI.panelActive = false;
	}
	
	// get the main window and outer window.
	var __getMainWindow = function() {return $('#gimli-main-window');};		// gimli content (this one is the "room")
	var __getMiddleWindow = function() {return $('#gimli-middle-window');};	// where the gimli content (the "room") is put into.
	var __getOuterWindow = function() {return $('#gimli-outer-window');};	// where console and middle window is put into.
	this.getOuterWindow = function() {return __getOuterWindow();}; // TODO: remove the var function.

	// 0.6.25: show mouse over image function external from data structure.
	var showMouseOverImage_ITEM = function(item, show=false)
	{
		if(show)
		{
			$('#item_image_'+item.getUniqueID()).hide();
			$('#item_image_over_'+item.getUniqueID()).show();
			return true;
		}else{
			$('#item_image_over_'+item.getUniqueID()).hide();
			$('#item_image_'+item.getUniqueID()).show();
		}
	}
	
	// 0.6.26: check for pixel-function external from data structure
	// check if the mouse collides with the image or not.
	var __checkForPixel_ITEM=function(item, evt) 
	{
		// get mouse position related to this item.
		var pos   = item.myDiv.offset();
	    var elPos = { X:pos.left , Y:pos.top };
	    var mPos  = { X:evt.clientX-elPos.X, Y:evt.clientY-elPos.Y };
		var mPosInt = { X:parseInt(mPos.X*1.0/item.collisionScaleFactor), Y:parseInt(mPos.Y*1.0/item.collisionScaleFactor) };
		
		// it does not collide when it is not on the area.
		if(mPosInt.X>=0 && mPosInt.Y>=0 && mPosInt.X<item.collisionWidth && mPosInt.Y<item.collisionHeight)
		{
			var pixelData=item.collisionDataContext.getImageData(mPosInt.X,mPosInt.Y,1,1).data;
			// check if the alpha value is > 0. Alpha is the third entry.
			if(pixelData[3]>0)
				return true;
		}
		return false;
	};

	// 0.6.25: mouseover function external from data structure.
	var isMouseOver_ITEM =function(item, evt)
	{
		// do nothing if the mouse is inactive.
		if(GIMLI.stopMouse || evt==null || GIMLI.panelActive)
			return false;
		
		// if the pixel is set, show the mouseover image.
		if(__checkForPixel_ITEM(item, evt))
		{
			showMouseOverImage_ITEM(item,true);
			return true;
		}else{
			showMouseOverImage_ITEM(item,false);
		}
		return false;
	}

	// event function to go through all items and check if there is a mouse over.
	var __mtouchover = function(evt)
	{
		//console.log("MTOUCHOVER");
		var outerwindow = $('#gimli-outer-window');
		var isover = null;
		var isloaded = true;
		for(var i = 0; i<m_actualRoomItems.length;i++)
		{
			var itm = m_actualRoomItems[i];
			// check if the collision image is already loaded.
			if(!itm.isCollisionLoaded())
				isloaded = false;
			if(isMouseOver_ITEM(itm, evt))
				isover=itm;
		}
		// maybe set another cursor
		// and show the name of the item.
		if(isover!=null)
		{
			outerwindow.css('cursor','pointer');
			
			// 0.6.27 : show name function removed, showing here directly.
			var d=$('#gimli-text-description');
			d.css('top', evt.clientY-20);
			d.css('left', evt.clientX-(d.width()*0.5));
			d.css('pointer-events', 'none');
			d.html(isover.itemName);
			if(isover.itemName.length>0)
				d.show();
			else
				d.hide();

		}else{
			outerwindow.css('cursor','auto');
			$('#gimli-text-description').hide();
		}
			
		// wait 50ms and redo if not all images are loaded.
		if(!isloaded)
			window.setTimeout(function() {__mtouchover(evt);}, 50);
	};
	this.mtouchover=function(evt) {__mtouchover(evt);}; // for using mtouchover on items.

	// 0.6.28: click for items external from data structure
	// do something when the item is clicked.
	var m_clickEvt = null;
	var m_clickItem = null;	// 0.6.28: needs an item for new click function.
	var click_ITEM=function(item,evt) 
	{
		m_clickEvt=evt;
		m_clickItem = item;
		
		var duration = GIMLI.getSoundDuration(item.clickSound);
		
		duration = parseInt(duration*1000*item.soundDelay + 1); // get in ms and add one ms.
		
		// (maybe) play the sound.
		GIMLI.playSound(item.clickSound);
		// click after the sound has played.
		setTimeout(__realClick_ITEM,duration);
	};
	var __realClick_ITEM = function()
	{
		if(m_clickItem==null)
			return;
		// click it.
		if(m_clickItem.scripts_click.length>0)
		{
			// 0.5.00: multible lines.
			for(var rc=0;rc<m_clickItem.scripts_click.length;rc++)
			{
				if(m_clickItem.scripts_click[rc]!=parseInt(m_clickItem.scripts_click[rc]))
					jBash.Parse(m_clickItem.scripts_click[rc]);
			}
		}
		// do an mtouchover after the click.
		__mtouchover(m_clickEvt);
	}

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

		// i forgot why the middle window is needed but it is.
		var mainwindow = jQuery.getNewDiv('','gimli-main-window', 'gimli-pixelperfect');
		var descriptionwindow = jQuery.getNewDiv('','gimli-text-description','gimli-text');
		descriptionwindow.css("display","none");
				
		// new, v0.3.01: wait for laoding window.
		var waitWindow = jQuery.getNewDiv('', 'gimli-wait-window', 'gimli-pixelperfect');
		// 0.6.11: add a sub message.
		var waitmsgcontainer = jQuery.getNewDiv('', '', 'gimli-pixelperfect gimli-verticalcenter gimli-waitcontainer');
		waitmsgcontainer.append(jQuery.getNewDiv('Loading...','','gimli-pixelperfect gimli-waitcontent'));
		waitmsgcontainer.append(jQuery.getNewDiv('TEST test TEST','gimli-wait-message', 'gimli-wait-message gimli-pixelperfect'));
		waitWindow.append(waitmsgcontainer);
		
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
		outerwindow.append(waitWindow);
		outerwindow.append(elconsole_outer);
		//outerwindow.append(descriptionwindow);
	
		// mouseover functions.
		outerwindow.mousemove(__mtouchover);
		outerwindow.on('touchstart',__mtouchover);
		outerwindow.on('touchmove',__mtouchover);
		outerwindow.on('touchend',__mtouchover);
		
		// go through all items and check if there is a click.
		outerwindow.click(function(evt)
		{
			var clickedItem = null;
			for(var i = 0; i<m_actualRoomItems.length;i++)
			{
				var itm = m_actualRoomItems[i];
				if(isMouseOver_ITEM(itm, evt))
					clickedItem = itm;
			}
			if(clickedItem!=null) {click_ITEM(clickedItem,evt);}
		});

		var t='<a href="https://github.com/ben0bi/GIMLI/">GIML-Interpreter</a> v'+GIMLIVERSION+' (JS-Version) by Benedict Jäggi in 2019&nbsp;|&nbsp;';
		t+='<a href="javascript:" onclick="GIMLI.showConsole();">console</a>&nbsp;|&nbsp;';
		t+='<a href="javascript:" onclick="GIMLI.showConsole();jBash.Parse(\'donate\');">donate</a>';
		var el2= jQuery.getNewDiv(t, 'gimli-footer-window', 'gimli-pixelperfect');
		jQuery.appendElementTo('head', css2);
		jQuery.appendElementTo('head', css);
		
		jQuery.appendElementTo('body', outerwindow);
		jQuery.appendElementTo('body', descriptionwindow); // description is on body for making it visible "everywhere".
		//jQuery.appendElementTo('body', diashowwindow); // the dia show window.		
		jQuery.appendElementTo('body', el2);
		
		// initialize the console.
		jBash.initialize("#gimli-jbash-window", "");
		// parse the cmd-Command to show commands.
		jBash.instance.Parse("cmd");
		
/* Some event functions */	
		// apply mouseover to the body.
		var body = $('body');
		body.mouseover(function(evt) {
			m_lastMouseEvent = evt;
			__scroll(evt, false);
		});
		body.mousemove(function(evt) {
			m_lastMouseEvent = evt;
			__scroll(evt, false);
		});
		body.mouseout(function(evt) {
			m_lastMouseEvent = evt;
			// stop all scrolling when the mouse leaves the body.
			__stopScroll(evt, false);
		});
		
/* new 0.3.08: keydown/up for scrolling */
/* 0.3.12: completely new (overall) scroll process (except for the mouse one, which worked good anyway) */
		body.keydown(function(evt) 
		{
			__scroll(evt,true);
		});
		body.keyup(function(evt) 
		{
			__stopScroll(evt,true);
		});
		
		// disable scrolling when jbash is on.
		var jb = $('#gimli-jbash-outer-window');
		jb.mouseover(function(evt) {m_scrollingEnabled=false;});
		jb.mouseout(function(evt) {m_scrollingEnabled=true;});
	}
	
	// play a sound from the sound bank.
	this.playSound = function(internName)
	{
		if(internName=='' || internName==null)
			return;
		
		// 0.6.15: externalized from the interpreter.
		var soundsLoaded = GMLParser.SOUNDS();
		
		for(var i=0;i<soundsLoaded.length;i++)
		{
			var s = soundsLoaded[i];
			if(s.getIntern()==internName)
			{
				if(s.audio!=null)
				{
					// maybe stop the sound and reset it.
					s.audio.pause();
					s.audio.currentTime = 0;
					// play the sound.
					s.audio.play();
				}
				return;
			}
		}
		log("Could not play sound '"+internName+"': Entry not found.", LOG_WARN); 
	}
	
	// get the duration of a sound.
	this.getSoundDuration = function(internName)
	{
		if(internName=='' || internName==null)
			return 0;

		// 0.6.15: NC external sounds.
		var soundsLoaded = GMLParser.SOUNDS();
		
		for(var i=0;i<soundsLoaded.length;i++)
		{
			var s = soundsLoaded[i];
			if(s.getIntern()==internName)
			{
				return s.duration;
			}
		}
		return 0;
	}
};
GIMLI.instance = new GIMLI();

// Initialize the GIMLI engine.
GIMLI.init = function(gmurl) {GIMLI.instance.init(gmurl);};

// some sound commands.
GIMLI.playSound = function(soundname) {GIMLI.instance.playSound(soundname);}
GIMLI.getSoundDuration = function(soundname) {return GIMLI.instance.getSoundDuration(soundname);}

// show and hide the loading window.
GIMLI.blockerPreferred = false;
GIMLI.showBlocker=function(show = true, submessage = "", preferred = false)
{
	log("Show blocker "+show, LOG_DEBUG_VERBOSE);
	
	// errors and warnings are preferred, they need to stay.
	if(GIMLI.blockerPreferred == false || preferred == true)
		$('#gimli-wait-message').html(submessage);
	
	// maybe set the preferred flag.
	// will be reset on hide.
	if(preferred==true)
		GIMLI.blockerPreferred = true;
	
	if(show==true)
	{
		$('#gimli-wait-window').show();
	}else{
		GIMLI.blockerPreferred = false;
		$('#gimli-wait-window').hide();
	}
}

// jump to another room (console command)
GIMLI.jump = function(params)
{
	var p = jBash.GP(params);
	var r = "";
	if(p!="")
	{
		r = p[0];
		x=0;
		y=0;
		if(r.toLowerCase()=="to" && p.length>1)
		{
			r = p[1];
			if(__defined(p[2])) x = parseInt(p[2]);
			if(__defined(p[3])) y = parseInt(p[3]);
		}else{
			if(__defined(p[1])) x = parseInt(p[1]);
			if(__defined(p[2])) y = parseInt(p[2]);
		}
	}else{
		jBash.Parse("man jump");
		return;
	}
	GIMLI.instance.jumpToRoom(r,x,y);
};

// show a specific panel (console command)
GIMLI.panel = function(params)
{
	var p = jBash.GP(params);
	var panelToShow = "";
	var closeall = false;
	if(p!="")
	{
		panelToShow=p[0];
		// maybe the closeall command is at the begin.
		if(panelToShow.toLowerCase()=="closeall")
		{
			panelToShow="";
			closeall = true;
		}
		// closeall command at begin and a panel to show.
		if(panelToShow.toLowerCase()=="" && p.length>1)
			panelToShow=p[1];
		// maybe the closeall command is at the end.
		if(p.length>1)
		{
			if(p[1].toLowerCase()=="closeall")
				closeall=true;
		}
	}else{
		jBash.parse("man panel");
		return;
	}
	if(closeall==true)
		GIMLI.instance.closeAllPanels();
	if(panelToShow!="")
		GIMLI.instance.showPanel(panelToShow);
}

// highlight a specific item / do other stuff with it.
GIMLI.item = function(params)
{
	var p = jBash.GP(params);
	var itemname="";
	if(p!="")
	{
		itemname=p[0];
		// it is: item itemname [focus] [move x y] etc..		
		// it could be [item unfocus] or such with no item name.
		switch(itemname.toLowerCase())
		{
			case "unfocus":
				GIMLI.instance.unfocusItems();
				return;
			case "focus":
				log("You need to give the item-name first and 'focus' with the 'item' command. E.g. {item my_item focus}", LOG_WARN);
				return;
			default:
				break;
		}

		// get the second command.
		if(p.length>1)
		{
			switch(p[1].toLowerCase())
			{
				case "focus":
					var x="not";
					var y=0;
					if(p.length>2)
						var x=parseInt(p[2]);
					if(p.length>3)
						var y=parseInt(p[3]);
					GIMLI.instance.focusItem(itemname,x,y);
					break;
				case "unfocus":
					GIMLI.instance.unfocusItems();
					break;
				default:
					jBash.parse("man item");
					break;
			}
		}
	}else{
		jBash.parse("man item");
		return;
	}
}

// Hooks for the jBash instance.
// the jump command.
jBash.registerCommand("jump", "Jump to a given room (intern name)<br />E.g. {<span class='jBashCmd'>jump to garden</span>}", GIMLI.jump);
jBash.registerCommand("j", "Short for the <span class='jBashCmd'>jump</span> command.", GIMLI.jump, true);

// the panel command.
// panel [panel_name] [closeall]
jBash.registerCommand("panel", "Show a panel and/or close all the other ones.<br />E.g. {<span class='jBashCmd'>panel closeall my_panel</span>}", GIMLI.panel);
jBash.registerCommand("p", "Show a panel and/or close all the other ones.<br />E.g. {<span class='jBashCmd'>panel closeall my_panel</span>}", GIMLI.panel);

// the item command
// item itemname [focus]
jBash.registerCommand("item", "Do something specific with an item. \"focus\" highlights the item and jumps to its room when it is another.", GIMLI.item);
jBash.registerCommand("i", "Do something specific with an item. \"focus [x, y]\" highlights the item and jumps to its room when it is another.", GIMLI.item);

// show debug stuff.
jBash.registerCommand("show", "Print out debug info for the given stuff.<br />E.g. {<span class='jBashCmd'>show items</span>}",
function(params)
{
	if(__defined(params[1]))
	{
		var arr = [];
		// first get the array.
		var typ = params[1].toLowerCase();
		switch(typ)
		{
			case "item":
			case "items":
				arr = GMLParser.ITEMS();
				break;
			case "room":
			case "rooms":
				// 0.6.12: externalized
				arr = GMLParser.ROOMS(); // NC GIMLI.instance.getStructure_ROOMS();
				break;
			case "sound":
			case "sounds":
				arr = GMLParser.SOUNDS(); // NC GIMLI.instance.getStructure_SOUNDS();
				break;
			case "panel":
			case "panels":
				arr = GMLParser.PANELS(); // NC GIMLI.instance.getStructure_PANELS();
				break;
			default:
				log("Wrong parameter. Use <span class='jBashCmd'>items</span>, <span class='jBashCmd'>rooms</span>, <span class='jBashCmd'>sounds</span> or <span class='jBashCmd'>panels</span> to get a list of the given array.", LOG_USER);
				break;
		}
		// second do something with the array.
		switch(typ)
		{
		// show a single item
			case "item":
			case "room":
			case "sound":
			case "panel":
				if(__defined(params[2]))
				{
					// use the index.
					var idx = parseInt(params[2]);
					var intern = params[2];
					if(idx.toString()==intern)
					{
						// print the given array
						if(idx>=0 && idx<arr.length)
							arr[idx].debug(LOG_USER);
						else
							log("The index is to small or to big. (0 to "+arr.length+") --&gt; "+idx, LOG_USER);
					}else{
						// try to use the intern name.
						var found = false;
						for(var q = 0;q<arr.length;q++)
						{
							if(arr[q].getIntern()==intern)
							{
								found = true;
								arr[q].debug(LOG_USER);
							}
						}
						if(!found)
							log(typ+" "+intern+" not found!", LOG_USER);
					}
				}else{
					log("Missing parameter. You need to define an index number if you use the show command this way.", LOG_USER);
				}
				break;
				
			// show a list with all the items.
			case "items":
			case "rooms":
			case "sounds":
			case "panels":
				log(" ", LOG_USER);
				log("Show list: (index, intern)",LOG_USER);
				for(var i=0;i<arr.length;i++)
				{
					log(i+": "+arr[i].getIntern(),LOG_USER);
				}
				var t="";
				switch(typ)
				{
					case "items": t="item";break;
					case "sounds": t="sound";break;
					case "panels":t="panel";break;
					case "rooms":t="room";break;
				}
				log("Endof List. "+arr.length+" entries.", LOG_USER);
				log("Use 'show "+t+" index' or 'show "+t+" internname' to view information about a specific entry."); 
				log(" ", LOG_USER);
				break;
			default:
				break;
		}
	}else{
		log("You need to provide a parameter.");
	}
});

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

/* FUNCTIONS to show and hide the console. */
GIMLI.stopMouse = false; // can we use the mouse?
GIMLI.panelActive = false; // can we use the mouse? (console uses stopMouse so we need another flag.)
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
		GIMLI.stopMouse = true;
		jBash.instance.focus();
		m___consoleDirection = 1;
	}

	t = t + 10 * m___consoleDirection;

	if(t>=0 && m___consoleDirection>0)
	{
		t = 0;
		m___consoleDirection=0;
	}
	
	// maybe hide the window.
	if(t < -c.height()-10 && m___consoleDirection<=0)
	{
		c.hide();
		GIMLI.stopMouse = false;
		m___consoleDirection = 0;
	}
	c.css('top', t+'px');
}
