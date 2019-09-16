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

 needs jQuery, BeJQuery, behelpers and jBash.
 Also needs, since 0.6.10: gimli-parser.js
 
 See the GIMLI-JSFILES.json in the config dir.
 
*/

const GIMLIVERSION = "0.6.13";

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

// 0.3.16: a panel with some text and buttons on it.
// button prototype for a panel.
// 0.3.22: outside panels.

//  NOT NC YET
var GIMLbutton = function()
{
	var m_buttonText = "";		// text shown for this button.
	var m_buttonFunctions = "";	// jBash function called with this button.
	var m_clickSound = "";
	var m_soundDelay = 1.0;
//	var m_clickEvt = null;
	var me = this;
	
	// return the dom element for this button.
	this.getDOMElement = function() 
	{
		var dom = jQuery.getNewDiv(m_buttonText,'','gimli-panel-button gimli-pixelperfect');
		$(dom).on('click', function(evt) {log("BUTTON '"+m_buttonText+"' clicked.",LOG_DEBUG); me.onClick(evt); });
		log("Adding button '"+m_buttonText+"' to panel.", LOG_DEBUG_VERBOSE);
		return dom;
	}
	this.getText=function() {return m_buttonText;}

	// the click function for this button.
	this.onClick = function(evt)
	{
//		m_clickEvt=evt;
		var duration = GIMLI.getSoundDuration(m_clickSound);
		//log("SOUND DURATION: "+duration);
		duration = parseInt(duration*1000)*m_soundDelay + 1; // get in ms and add one ms.
		// (maybe) play the sound.
		GIMLI.playSound(m_clickSound);
		// click after the sound has played.
		setTimeout(__realClick,duration);

		// do not click through!
		evt.stopPropagation();
		evt.preventDefault();
		evt.stopImmediatePropagation();
		return false;

	}
	var __realClick = function()
	{
		if(m_buttonFunctions.length>0)
		{
			// 0.4.01: array instead of single function.
			for(var btnfi=0;btnfi<m_buttonFunctions.length;btnfi++)
			{
				var line = m_buttonFunctions[btnfi];
				if(line!="")
					jBash.Parse(line);
			}
		}
		else
			log("This button has no function associated.", LOG_WARN);		
	}
		
	// get the gml.
	this.parseGML = function(GIMLbutton)
	{
		if(__defined(GIMLbutton['TEXT']))
			m_buttonText=GIMLbutton['TEXT'];
		// button functions in an array.
		m_buttonFunctions = [];
		if(__defined(GIMLbutton['ONCLICK']))
		{
			var arr = GIMLbutton['ONCLICK'];
			for(var ic=0;ic<arr.length;ic++)
				m_buttonFunctions.push(arr[ic])
		}
		if(__defined(GIMLbutton['SCRIPT']))
		{
			var arr = GIMLbutton['SCRIPT'];
			for(var ic=0;ic<arr.length;ic++)
				m_buttonFunctions.push(arr[ic])
		}
		if(__defined(GIMLbutton['SCRIPTS']))
		{
			var arr = GIMLbutton['SCRIPTS'];
			for(var ic=0;ic<arr.length;ic++)
				m_buttonFunctions.push(arr[ic])
		}

		// loading in the sound.
		if(__defined(GIMLbutton['SOUND']))
			m_clickSound = GIMLbutton['SOUND'];
		var cs2 = m_clickSound.split(' ').join('_');
		if(m_clickSound!=cs2)
		{
			log("Spaces are not allowed in intern names. [Panelbutton-Clicksound]['"+m_clickSound+"' ==&gt; '"+cs2+"']", LOG_WARN);
			m_clickSound = cs2;
		}
		
		// get the sound delay.
		if(__defined(GIMLbutton['DELAY']))
			m_soundDelay = parseFloat(GIMLbutton['DELAY']);
	}
};

/* a gimli panel. */

// NOT NC YET
var GIMLpanel = function()
{
	var me = this;
	var m_text = ""; // the text for this panel.
	var m_internName = "";
	var m_buttons = []; // array with all the buttons for this panel.
	var m_panelDiv = null;
	
	this.getIntern = function() {return m_internName;};
		
	// get the count of buttons for this panel.
	var __buttonCount = function() {return m_buttons.length};
	
	// show some debug information about this panel.
	this.debug= function(loglevel = LOG_DEBUG_VERBOSE)
	{
		log("* PANEL intern name: "+m_internName,loglevel);
		log("--&gt; Button count: "+__buttonCount(), loglevel);
		log(" ", loglevel);
	}
	
	// parse the gml for that panel.
	this.parseGML=function(gmlPanel)
	{
		// get the text for this panel.
		if(__defined(gmlPanel['TEXT']))
		{
			var t=gmlPanel['TEXT'];
			m_text="";
			for(var i=0;i<t.length;i++)
				m_text=m_text+t[i];
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
				var b = new GIMLbutton();
				b.parseGML(btn);
				m_buttons.push(b);
			}
		}
		
		// or just one button. buttonS are before button (no s)
		if(__defined(gmlPanel['BUTTON']))
		{
			var btn = gmlPanel['BUTTON'];
			var b = new aButton();
			b.parseGML(btn);
			m_buttons.push(b);	
		}
	};
	
	// show the panel on the gimli screen.
	this.show = function()
	{
		// stop the mouse action first.
		GIMLI.panelActive = true;
		
		var GIMLIwindow = GIMLI.instance.getOuterWindow();
		m_panelDiv = jQuery.getNewDiv('','gimli-panel-'+m_internName, 'gimli-panel gimli-pixelperfect');
		
		// the div with the content in it.
		var contentDiv = jQuery.getNewDiv(m_text,'','gimli-panel-contentdiv gimli-pixelperfect');
		// add the buttons.
		var buttonDiv = jQuery.getNewDiv('','','gimli-panel-buttondiv gimli-pixelperfect');
		for(var i=0;i<m_buttons.length; i++)
		{
			var b=m_buttons[i];
			var btnDiv = b.getDOMElement();
			buttonDiv.append(btnDiv);
		}
		
		// check for the height.
/*		if(m_panelDiv.height()>GIMLIwindow.height()-30)
		{
			m_panelDiv.css('top', '0px');
			m_panelDiv.append("<br />");
		}
*/		
		m_panelDiv.append(contentDiv);
		m_panelDiv.append(buttonDiv);
		GIMLIwindow.append(m_panelDiv);

		// maybe adjust the height.
		if(m_panelDiv.height() >= GIMLIwindow.height()-30)
		{
			var hc = parseInt(GIMLIwindow.height()*0.1*7.0)+'px';
			var hb = parseInt(GIMLIwindow.height()*0.1*3.0)+'px';
			contentDiv.css('max-height',hc);
			buttonDiv.css('max-height', hb);
			m_panelDiv.css('max-height', GIMLIwindow.height()+'px');
			m_panelDiv.css('top', '0px');
		}
	}
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// a sound file in the giml system.

// NOT NC YET
var GIMLsound = function()
{
	var me = this;
	var m_soundFile ="";	// the name of the sound file.
	var m_internName = "";	// the intern name of this sound.
	var m_folder = "";		// folder where the sound resides.
	var m_audio = null;		// audio data for this sound file.
	var m_duration = 0.0;	// duration of this sound in seconds.
	
	this.getIntern = function() {return m_internName;};
	
	var __load = function()
	{
		if(m_audio==null)
		{
			m_audio=new Audio();
			m_audio.preload = "metadata";
			m_audio.addEventListener("loadedmetadata", function() {m_duration = m_audio.duration;});
			m_audio.src=m_folder+m_soundFile;
			log("Audio loaded for '"+m_internName+"' ==&gt; "+m_folder+m_soundFile);
			return;
		}
	}
	
	// play the sound. if it is not loaded yet, load it before.
	this.playSound = function()
	{
		if(m_audio!=null)
		{
			m_audio.pause();
			m_audio.currentTime = 0;
			m_audio.play();
		}
	};

	// get the duration of the sound file.
	this.getDuration=function() {return m_duration;}
	
	// parse the gml for this SOUND.
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
		
		//log("SND PATH: "+m_folder+m_soundFile);
		__load(); // preload the sound.
	};
		
	this.debug = function(loglevel = LOG_DEBUG)
	{
		log("* SOUND: "+m_internName, loglevel);
		log("--&gt; File: "+m_soundFile, loglevel);
		log("--&gt; Duration: "+m_duration+"s", loglevel);
		log("--&gt; resides in: "+m_folder, loglevel);
		log(" ", loglevel);
	}
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// an item in the giml system.

// NOT NC YET
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
	var m_soundDelay = 1.0;		// wait this * sound_length until the click will be done.

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
	var m_scaleFactor = 1.0;	// the scale factor without world scale factor.
	var m_scripts_click = [];

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
	this.getDOMElement = function(outerscalefactor = 1.0) 
	{
		m_myDiv = null;
		m_CollisionLoaded = false;

		var sc = me.getScaleFactor(outerscalefactor);

		var path = __shortenDirectory(m_folder+m_imageFile);
		var overpath = __shortenDirectory(m_folder+m_overImageFile);
		var collisionpath = __shortenDirectory(m_folder+m_collisionImageFile);
		
		/*log("ITEM PATHS: ", LOG_DEBUG);
		log("* MAIN: "+path, LOG_DEBUG);
		log("* OVER: "+overpath, LOG_DEBUG);
		log("* COLL: "+collisionpath, LOG_DEBUG);
		*/
		
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
	var m_clickEvt = null;
	this.click=function(evt) 
	{
		m_clickEvt=evt;
		var duration = GIMLI.getSoundDuration(m_clickSound);
		//log("SOUND DURATION: "+duration);
		duration = parseInt(duration*1000)*m_soundDelay + 1; // get in ms and add one ms.
		// (maybe) play the sound.
		GIMLI.playSound(m_clickSound);
		// click after the sound has played.
		setTimeout(__realClick,duration);
	};
	var __realClick = function()
	{
		// click it.
		if(m_scripts_click.length>0)
		{
			// 0.5.00: multible lines.
			for(var rc=0;rc<m_scripts_click.length;rc++)
			{
				if(m_scripts_click[rc]!=parseInt(m_scripts_click[rc]))
					jBash.Parse(m_scripts_click[rc]);
			}
		}
		// do an mtouchover after the click.
		GIMLI.instance.mtouchover(m_clickEvt);
	}

	// show debug information.
	this.debug=function(loglevel=LOG_DEBUG) {
		log("* ITEM '"+m_itemName+"' (intern: '"+m_internName+"')", loglevel);
		log(" --&gt; resides in '"+m_folder+"'", loglevel);
		log(" --&gt; Image: '"+m_imageFile+"'", loglevel);
		log(" --&gt; Collision: '"+m_collisionImageFile+"'", loglevel);
		log(" --&gt; Mouseover: '"+m_overImageFile+"'", loglevel);
		log(" --&gt; Clicksound: '"+m_clickSound+"'", loglevel);
		log(" --&gt; Loc./Room: ['"+m_posLocation+"', "+m_posX+", "+m_posY+"]", loglevel);
		log(" ", loglevel);
	};
	
	// show or hide the mouseover image of this item.
	// 0.3.05
	this.showMouseOverImage=function(show=false)
	{
		if(show)
		{
			$('#item_image_'+m_id).hide();
			$('#item_image_over_'+m_id).show();
			return true;
		}else{
			$('#item_image_over_'+m_id).hide();
			$('#item_image_'+m_id).show();
		}
	}
	
	// check if the mouse is over an item and show the appropiate image.
	var __checkMouseOver = function(evt)
	{
		// do nothing if the mouse is inactive.
		if(GIMLI.stopMouse || evt==null || GIMLI.panelActive)
			return false;
		
		// if the pixel is set, show the mouseover image.
		if(__checkForPixel(evt))
		{
			me.showMouseOverImage(true);
			return true;
		}else{
			me.showMouseOverImage(false);
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
		m_scripts_click = [];
		m_soundDelay = 1.0;

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
		
		// get the click events
		// 0.5.00
		if(__defined(gmlItem['ONCLICK']))
		{
			var arr = gmlItem['ONCLICK'];
			for(var ic=0;ic<arr.length;ic++)
				m_scripts_click.push(arr[ic])
		}
		if(__defined(gmlItem['SCRIPT']))
		{
			var arr = gmlItem['SCRIPT'];
			for(var ic=0;ic<arr.length;ic++)
				m_scripts_click.push(arr[ic])
		}
		if(__defined(gmlItem['SCRIPTS']))
		{
			var arr = gmlItem['SCRIPTS'];
			for(var ic=0;ic<arr.length;ic++)
				m_scripts_click.push(arr[ic])
		}
				
		// get the sound to play when the item is clicked.
		if(__defined(gmlItem['SOUND']))
			m_clickSound = gmlItem['SOUND'];
		var cs2 = m_clickSound.split(' ').join('_');
		if(m_clickSound!=cs2)
		{
			log("Spaces are not allowed in intern names. [Item-Clicksound]['"+m_clickSound+"' ==&gt; '"+cs2+"']", LOG_WARN);
			m_clickSound = cs2;
		}
		
		// get the sound delay.
		if(__defined(gmlItem['DELAY']))
			m_soundDelay = parseFloat(gmlItem['DELAY']);
	};
	
	// add this item to a room div.
	this.addToRoomDiv=function(div, outerscalefactor = 1.0)
	{
		log("Placing the item '"+m_internName+"' in the room...", LOG_DEBUG);
		var myElement = me.getDOMElement(outerscalefactor);
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

// NOT NC YET
/*var GIMLroom = function()
{
// NC
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
// ENDOF NC
	
	this.debug=function(loglevel=LOG_DEBUG) {
		log("* ROOM '<span class='jBashCmd'>"+m_roomName+"</span>' (intern: '<span class='jBashCmd'>"+m_internName+"</span>')", loglevel);
		log(" --&gt; resides in '"+m_folder+"'", loglevel);
		log(" --&gt; bgImage: '"+m_bgImageFile+"'", loglevel);
		log(" --&gt; ITEMS:", loglevel);
		var arr = GIMLI.instance.getStructure_ITEMS();
		for(var i=0;i<arr.length;i++)
		{
			if(arr[i].getLocationIntern()==m_internName)
				log("--&gt; * "+i+": "+arr[i].getIntern(), loglevel);
		}
		log(" ", loglevel);
	};
};
*/

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

		log("MakeGMLUrl: "+gmurl,LOG_DEBUG_VERBOSE)
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

// 0.5.11-0.6.0: GML collector for synced loading.
// This is for loading all gml filenames and THEN loading all gmls.
// Previous versions started the init process before all gmls were loaded because of async timing problems.
// hope this works better, despite the maybe longer loading time. Sorry for that.

// 0.5.17: implemented gmlcollect into gimli directly.
// .. there was a little class here ..

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/*******************************************************************************************************************************************************************/

// The GIML-Interpreter
var GIMLI = function()
{
	var me = this; // protect this from be this'ed from something other inside some brackets.
	
	//var m_GMURL_initpage = "";  // the gml file which was called on the init function.
// NC
//	var m_actualRoomIntern = "@ STARTLOCATION/STARTROOM not found. @"; // the actual room intern name.
//	var m_startRoomIntern = "@ STARTLOCATION/STARTROOM not found. @"; // the start room intern name.
// ENDOF NC
	var m_actualRoomX = 0;
	var m_actualRoomY = 0;
// NC	var m_roomsLoaded = [];		// the rooms (locations) loaded with the gml file.
	var m_itemsLoaded = [];		// the items loaaded with the gml file.
	var m_soundsLoaded = [];	// the sounds loaded with the gml file.
	var m_panelsLoaded = [];	// the panels loaded with the gml file. (0.3.16)

	// 0.6.01: Get the structures out of this class.
	this.getStructure_ITEMS = function() {return m_itemsLoaded;};
//	this.getStructure_ROOMS = function() {return m_roomsLoaded;};
	this.getStructure_SOUNDS = function() {return m_soundsLoaded;};
	this.getStructure_PANELS = function() {return m_panelsLoaded;};
	
//	var m_loadedGMLFiles = [];	// list with all the GML files which were loaeded.
	// 0.5.17: global file array instead of local one.
	var m_gmlFileArray = [];
	
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
	
	// the size factor. usually 1 or 2
//	var m_scaleFactor = 1.0;

// THIS IS THE MAIN GML FUNCTION SO FAR
	
	// load a gml json file.
	this.parseGML = function(json, rootPath = "")
	{
// NC
		log("Parsing GML [Path: "+rootPath+"]"/*+JSON.stringify(json)*/, LOG_DEBUG_VERBOSE);
		
		log("Converting array names to uppercase..", LOG_DEBUG_VERBOSE);
		var json2 = __jsonUpperCase(json);
		json = json2;
		
		if(json==null)
		{
			log("SEVERE ERROR: JSON for a GML file in "+rootPath+" is null", LOG_ERROR);
			return;
		}
	
		// 0.5.18: gml file collector in the parser.
		// get the gmls structure.
		var gmlArray = [];
		if(__defined(json['GMLS']))
			gmlArray = json['GMLS'];
					
		// check if the entries already exist, else add them.
		for(var g=0;g<gmlArray.length;g++)
		{
			var gml = GMLurl.makeGMURL(gmlArray[g]);
			var innerfound = false;
			for(var q=0;q<m_gmlFileArray.length;q++)
			{
				var chk=m_gmlFileArray[q].gmurl.getCombined();
				var gmlpath = __shortenDirectory(__addSlashIfNot(rootPath)+gml.getCombined());
				if(gmlpath==__shortenDirectory(chk))
				{
					innerfound= true;
					break;
				}
			}
			// add it to the list.
			if(!innerfound)
			{
				var colladd = GMLurl.makeGMURL(gmlpath);
				log("GML collection add: "+colladd.getCombined(), LOG_DEBUG); 
				m_gmlFileArray.push(new GMLfile(colladd));
			}
		}
	
		// get the start room. (StartLocation or StartRoom)
//		if(__defined(json['STARTLOCATION']))
//			m_actualRoomIntern = m_startRoomIntern = json['STARTLOCATION'];
//		if(__defined(json['STARTROOM']))
//			m_actualRoomIntern = m_startRoomIntern = json['STARTROOM'];
		
		// get the global scale factor.
//		if(__defined(json['SCALEFACTOR']))
//			m_scaleFactor = parseFloat(json['SCALEFACTOR']);
//		if(__defined(json['SCALE']))
//			m_scaleFactor = parseFloat(json['SCALE']);
		
		// get locations (LOCATIONS or ROOMS)
/*		var roomArray = [];
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
				var room = new GIMLroom();
				room.parseGML(jroom, rootPath);
				m_roomsLoaded.push(room);
				room.debug(LOG_DEBUG_VERBOSE);
			}
		}
*/
// ENDOF NC
		
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
		}

		// load in the sounds.
		if(__defined(json['SOUNDS']))
		{
			var soundArray = json['SOUNDS'];
			for(var i=0;i<soundArray.length;i++)
			{
				var sound=soundArray[i];
				var snd = new GIMLsound();
				// we need to include the project path here instead of "jump to room".
				
				//0.5.20: m_gmlurl_initpage is obsolete.
				snd.parseGML(sound, rootPath);

				m_soundsLoaded.push(snd);
				snd.debug(LOG_DEBUG_VERBOSE);
			}
		}

		// load in the text panels (dialogues, "real" panels)
		if(__defined(json['PANELS']))
		{
			var panelArray = json['PANELS'];
			for(var i=0;i<panelArray.length;i++)
			{
				var panel=panelArray[i];
				var pnl = new GIMLpanel();
				pnl.parseGML(panel);
				m_panelsLoaded.push(pnl);
				pnl.debug(LOG_DEBUG_VERBOSE);
			}
		}
		
		// load the additional gml files recursively and one after each other.
		// 0.5.17: load with the new collector code.
	};
	
	this.debug=function(loglevel)
	{
		var globals = GMLParser.GLOBALS();
		log("GML start room: "+globals.startRoomIntern, loglevel);
		log("General GML scale factor: "+parseFloat(globals.scaleFactor), loglevel);
		log(GMLParser.ROOMS().length+ " rooms loaded.",loglevel);
		log(__itemCount()+" items loaded.", loglevel);
		log(__soundCount()+" sounds loaded.",loglevel);
		log(__panelCount()+" text panels loaded.", loglevel);
	}

	// load all the gml files recursively.
	// 0.5.17: this function is obsolete
	/* ... */

	// 0.5.17: GMLfile in GIMLI
	var GMLfile = function(gmurl)
	{
		this.gmurl = gmurl;		
		this.collected = false;
	}

	// 0.5.17: collect function instead of recursive load function
	// get the first one to collect and do it.
	var collectioncounter = 0;
	var collect = function()
	{
		collectioncounter++;
		log("COLLECTION #"+collectioncounter+" / "+m_gmlFileArray.length+" entries to check.", LOG_DEBUG);
		
		var found = false;
		for(var i=0;i<m_gmlFileArray.length;i++)
		{
			var l = m_gmlFileArray[i];
			var filepath= l.gmurl.getCombined();
			if(l.collected==false) // load the stuff and break the loop.
			{
				log("Collecting entry #"+i+" @ "+filepath, LOG_DEBUG);
				found = true;
				
				// load the file and collect its GMLs.
				var relativePath = __shortenDirectory(GMLurl.makeGMURL(__addSlashIfNot(l.gmurl.getDirectory())+m_gmlFileArray[i]).getDirectory());

				__loadJSON(filepath, function(json)
				{
					//log("RELPATH: "+relativePath);
					me.parseGML(json,relativePath);

					l.collected = true;
					//log("Collected entry #"+i+": "+l.gmurl.getCombined(), LOG_DEBUG);
					// repeat the collecting process until all gmls are collected.
					collect();
				});
				break;
			}//else{
			//	log("COLLECTION entry #"+i+" already collected. ("+filepath+")");
			//}
		}
		
		// if nothing was found, all files were loaded.
		// jump to the start room.
		if(found==false)
		{
			log(m_gmlFileArray.length+" files loaded.",LOG_DEBUG);
			log("-------- ENDOF COLLECTING GMLS ---------",LOG_DEBUG);
			
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
			setTimeout(GIMLI.hideConsole,750);
		}
	}


// ENDOF GML PARSER
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
		for(var i=0; i < __itemCount(); i++)
		{
			var itm = m_itemsLoaded[i];
			var intern = itm.getIntern();
			if(room.getIntern() == itm.getLocationIntern())
			{
				count++;
				itm.addToRoomDiv(newroom, room.getScaleFactor(globals.scaleFactor));
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
	var __clearItems = function() {m_itemsLoaded = [];};
	var __clearSounds = function() {m_soundsLoaded = [];};
	var __clearPanels = function() {m_panelsLoaded = [];};
//	NC var __roomCount = function() {return m_roomsLoaded.length;}
	var __itemCount = function() {return m_itemsLoaded.length;}
	var __soundCount = function() {return m_soundsLoaded.length;}
	var __panelCount = function() {return m_panelsLoaded.length;}
	
	// OBSOLETE
/*	var __isGMLFileLoaded = function(filepath)
	{
		for(var i=0;i<m_loadedGMLFiles.length;i++)
		{
			if(__shortenDirectory(m_loadedGMLFiles[i]) == __shortenDirectory(filepath))
				return true;
		}
		return false;
	}
*/		
	// initialize gimli with a gml-file.
	var m_roomByURL = "";
	this.init = function(gmurl)
	{	
		// create the main window, including the console.
		__createMainWindow();

		GIMLI.showBlocker(true, "Welcome to GIMLI");
		//return; // TODO: REMOVE THAT RETURN

		PARSEGMLFILE(gmurl);

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
	
		var checkurl = GMLurl.makeGMURL(__shortenDirectory(gmurl));
		// 0.5.19: set the initpage directory to the first loaded gmurl.
		//m_GMURL_initpage = checkurl;
		log("Loading "+checkurl.getCombined()+"...");

		// 0.5.17: clearing everything before loading the json.
		__clearItems();
		__clearRooms();
		__clearPanels();
		__clearSounds();
// NC		m_scaleFactor=1.0;

		log("----------- COLLECTING GMLS ----------------", LOG_DEBUG);
	
		// clear the gml file array.
		m_gmlFileArray=[];

		// 0.5.17: add first file to the collection.		
		// add the first file.
		// put the first filename into the list.
		var first = new GMLfile(checkurl);
		m_gmlFileArray.push(first);
	
		// 0.5.17: start collection
		collect();
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
			itm.showMouseOverImage(false);
		}
	}
	
	// 0.5.03: focus on an item. Jump to another room if it has one.
	this.focusItem=function(itemname,x="not",y="not")
	{
		// get the item.
		for(var i=0;i<__itemCount();i++)
		{
			var itm=m_itemsLoaded[i];
			if(itm.getIntern()==itemname)
			{
				var globals = GMLParser.GLOBALS();
				
				// jump to another room if the item is not here.
				var iloc=itm.getLocationIntern();
				var interval = 1;
				if(iloc!=globals.actualRoomIntern)
				{
					interval=1000;
					log("Item '"+itemname+"' is in another room. Actual room is '"+globals.actualRoomIntern+"'. Jumping to room '"+iloc+"'..");
					jBash.Parse("jump to "+iloc);
				}
				// highlight the item.
				itm.showMouseOverImage(true);
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
		//log("Scroll: W"+w+" H"+h+" +x"+l+" +y"+t+" X"+cx+" Y"+cy, LOG_DEBUG);		
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
	
	// 0.3.19: show a specific panel.
	this.showPanel= function(internName)
	{
		for(var i=0;i<__panelCount();i++)
		{
			var p = m_panelsLoaded[i];
			if(p.getIntern()==internName)
			{
				p.show();
				return;
			}
		}
		log("Panel '"+internName+"' does not exist.", LOG_WARN);
	}
	
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

	// event function to go through all items and check if there is a mouse over.
	var __mtouchover = function(evt)
	{
		var outerwindow = $('#gimli-outer-window');
		var isover = null;
		var isloaded = true;
		for(var i = 0; i<m_actualRoomItems.length;i++)
		{
			var itm = m_actualRoomItems[i];
			// check if the collision image is already loaded.
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
			window.setTimeout(function() {__mtouchover(evt);}, 50);
	};
	this.mtouchover=function(evt) {__mtouchover(evt);}; // for using mtouchover on items.

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
				if(itm.isMouseOver(evt))
					clickedItem = itm;
			}
			if(clickedItem!=null)
			{
				clickedItem.click(evt);
			}
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
	
	// get the duration of a sound.
	this.getSoundDuration = function(internName)
	{
		if(internName=='' || internName==null)
			return 0;
		
		for(var i=0;i<m_soundsLoaded.length;i++)
		{
			var s = m_soundsLoaded[i];
			if(s.getIntern()==internName)
			{
				return s.getDuration();
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
				break;
			case "focus":
				log("You need to give the item-name first and 'focus' with the 'item' command. E.g. {item my_item focus}", LOG_WARN);
				break;
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
				arr = GIMLI.instance.getStructure_ITEMS();
				break;
			case "room":
			case "rooms":
				// 0.6.12: externalized
				arr = GMLParser.ROOMS(); // NC GIMLI.instance.getStructure_ROOMS();
				break;
			case "sound":
			case "sounds":
				arr = GIMLI.instance.getStructure_SOUNDS();
				break;
			case "panel":
			case "panels":
				arr = GIMLI.instance.getStructure_PANELS();
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

/* FUNCTIONS to Show and hide the console. */
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
