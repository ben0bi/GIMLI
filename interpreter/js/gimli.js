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
 See the GIMLI-JSFILES.json in the config dir.
 
*/

const GIMLIVERSION = "0.4.04";

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
					jBash.instance.DoLine(line);
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
		m_panelDiv = jQuery.getNewDiv(m_text, 'gimli-panel-'+m_internName, 'gimli-panel gimli-pixelperfect');
		
		// add the buttons.
		for(var i=0;i<m_buttons.length; i++)
		{
			var b=m_buttons[i];
			var btnDiv = b.getDOMElement();
			m_panelDiv.append(btnDiv);
		}
		
		GIMLIwindow.append(m_panelDiv);

		// check for the height.
		if(m_panelDiv.height()>GIMLIwindow.height()-30)
		{
			m_panelDiv.css('top', '0px');
			m_panelDiv.append("<br />");
		}
	}
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// a sound file in the giml system.
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
		log("* SOUND ("+m_duration+"s): "+m_internName, loglevel);
		log("--&gt; File: "+m_soundFile, loglevel);
		log("--&gt; Duration: "+m_duration+"s", loglevel);
		log(" ", loglevel);
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
		if(m_script_click.length>0 && m_script_click!=parseInt(m_script_click))
		{
			jBash.Parse(m_script_click);
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
	
	// check if the mouse is over an item and show the appropiate image.
	var __checkMouseOver = function(evt)
	{
		// do nothing if the mouse is inactive.
		if(GIMLI.stopMouse || evt==null || GIMLI.panelActive)
			return false;
		
		// if the pixel is set, show the mouseover image.
		if(__checkForPixel(evt))
		{
			$('#item_image_'+m_id).hide();
			$('#item_image_over_'+m_id).show();
			return true;
		}else{
			$('#item_image_over_'+m_id).hide();
			$('#item_image_'+m_id).show();
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
		// get the click events (XHEREX todo)
		if(__defined(gmlItem['SCRIPT'])) // script happens on click, but onclick is preferred.
			m_script_click = gmlItem['SCRIPT'];
		if(__defined(gmlItem['SCRIPTS'])) // script happens on click, but onclick is preferred.
			m_script_click = gmlItem['SCRIPTS'];
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
		
		// get the sound delay.
		if(__defined(gmlItem['DELAY']))
			m_soundDelay = parseFloat(gmlItem['DELAY']);
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
	var m_soundsLoaded = [];	// the sounds loaded with the gml file.
	var m_panelsLoaded = [];	// the panels loaded with the gml file. (0.3.16)
	var m_loadedGMLFiles = [];	// list with all the GML files which were loaeded.
	
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
	var m_scaleFactor = 1.0;

// THIS IS THE MAIN GML FUNCTION SO FAR
	
	// load a gml json file.
	this.parseGML = function(json, rootPath = "")
	{
		log("Parsing GML [Path: "+rootPath+"]:"/*+JSON.stringify(json)*/, LOG_DEBUG_VERBOSE);
		
		log("Converting array names to uppercase..", LOG_DEBUG_VERBOSE);
		var json2 = __jsonUpperCase(json);
		json = json2;
		
		// get additional gml files.
		var gmlArray = [];
		if(__defined(json['GMLS']))
			gmlArray = json['GMLS'];
		
		// get the start room. (StartLocation or StartRoom)
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
				snd.parseGML(sound, __shortenDirectory(__addSlashIfNot(m_GMURL_initpage.getDirectory())+rootPath));
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
				pnl.debug(LOG_DEBUG);
			}
		}
		
		// load the additional gml files recursively and one after each other.
		m_recLoadedFiles+=gmlArray.length;
		__recursiveload(gmlArray,0, rootPath);
	};
	
	this.debug=function(loglevel)
	{
		log("GML start room: "+m_startRoomIntern, loglevel);
		log("General GML scale factor: "+parseFloat(m_scaleFactor), loglevel);
		log(__roomCount()+ " rooms loaded.",loglevel);
		log(__itemCount()+" items loaded.", loglevel);
		log(__soundCount()+" sounds loaded.",loglevel);
		log(__panelCount()+" text panels loaded.", loglevel);
	}

	// load all the gml files recursively.
	var m_recLoadedFiles = 0;
	var m_afterLoadCalled = false;	// only call after load if it is not called before.
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
		
		//log("RECLF:" +m_recLoadedFiles+" / "+m_loadedGMLFiles.length);
		
		// after the last load, call the afterload function.
		if(!m_afterLoadCalled && m_recLoadedFiles<=m_loadedGMLFiles.length)
		{
			m_afterLoadCalled=true;
			m_afterLoadFunction();
			me.debug(LOG_USER);
			log("----------------- ALL GMLS LOADED. ------------------------", LOG_USER);
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
		
		// show the blocker while it waits for the loading.
		GIMLI.showBlocker(true);
		
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
	var __clearSounds = function() {m_soundsLoaded = [];};
	var __clearPanels = function() {m_panelsLoaded = [];};
	var __roomCount = function() {return m_roomsLoaded.length;}
	var __itemCount = function() {return m_itemsLoaded.length;}
	var __soundCount = function() {return m_soundsLoaded.length;}
	var __panelCount = function() {return m_panelsLoaded.length;}
	
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
		if(__roomCount()<=0)
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
		if(__itemCount()<=0)
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
	
	// show debug info about the sounds.
	this.debugSounds = function()
	{
		if(__soundCount()<=0)
		{
			log("There are no sounds loaded.", LOG_USER);
			return;
		}
		log(" ", LOG_USER);
		log("+++ <span class='jBashCmd'>SHOWING DATA FOR "+__soundCount()+" LOADED SOUNDS.</span> +++", LOG_USER);
		for(var i=0;i<__soundCount();i++)
		{
			m_soundsLoaded[i].debug(LOG_USER);
		}
	}
	
	// show debug info about all panels.
	this.debugPanels = function()
	{
		if(__panelCount()<=0)
		{
			log("There are no panels loaded", LOG_USER);
			return;
		}
		log(" ", LOG_USER);
		log("+++ <span class='jBashCmd'>SHOWING DATA FOR "+__panelCount()+" LOADED PANELS.</span> +++", LOG_USER);
		for(var i=0;i<__panelCount();i++)
		{
			m_panelsLoaded[i].debug(LOG_USER);
		}
	}
	
	// initialize gimli with a gml-file.
	var m_afterLoadFunction = function() {};
	this.init = function(gmurl)
	{		
		// create the main window, including the console.
		__createMainWindow();

		// get the url parameters.
		var initurl=window.location.href;
		initurl = initurl.split("?");
		// get the room directly from the "first" parameter.
		if(initurl.length>1)
		{
			initurl=initurl[1];
		}else{
			initurl="";
		}
		
		log("Set room from URL: "+initurl, LOG_DEBUG);
	
		var checkurl = GMLurl.makeGMURL(gmurl);
		log("Loading "+checkurl.getCombined()+"...");
		// load the gml file.
		// TODO: do after load stuff after recursive load. (jumptostartroom should be called after all recursiveloads.)
		me.loadJSONFile(checkurl.getCombined(), function(json) {
			m_GMURL_initpage = checkurl;
			// clear all preloaded stuff.
			__clearItems();
			__clearRooms();
			m_scaleFactor=1.0;

			// clear the loaded files array and push this filename.
			m_loadedGMLFiles = [];
			m_loadedGMLFiles.push(checkurl.getCombined());
			
			// set the after load function.
			m_afterLoadFunction = function()
			{
				log("Issuing after load function...", LOG_DEBUG);
				if(initurl!="")
					me.jumpToRoom(initurl);
				else
					me.jumpToStartRoom();
			};
			
			me.parseGML(json);
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
				m_scrollIntervalFunction=setInterval(__realScroll_keys, 15);
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
			m_scrollIntervalFunction=setInterval(__realScroll_mouse, 15);
		}else{
			if(m_isScrolling==0)
			{
				if(m_scrollIntervalFunction!=null)
					clearInterval(m_scrollIntervalFunction);
				m_scrollIntervalFunction = null;
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
					log("JSON from "+urlToFile+" loaded.", LOG_DEBUG_VERBOSE);
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
				
		// new, v0.3.01: wait for laoding window.
		var waitWindow = jQuery.getNewDiv('', 'gimli-wait-window', 'gimli-pixelperfect');
		waitWindow.append(jQuery.getNewDiv('Loading...','','gimli-pixelperfect gimli-verticalcenter gimli-waitcontent'));
		
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
GIMLI.showBlocker=function(show = true)
{
	log("Show blocker "+show, LOG_DEBUG_VERBOSE);
	if(show==true)
		$('#gimli-wait-window').show();
	else
		$('#gimli-wait-window').hide();
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

// Hooks for the jBash instance.
// the jump command.
jBash.registerCommand("jump", "Jump to a given room (intern name)<br />E.g. {<span class='jBashCmd'>jump to garden</span>}", GIMLI.jump);
jBash.registerCommand("j", "Short for the <span class='jBashCmd'>jump</span> command.", GIMLI.jump, true);

// the panel command.
jBash.registerCommand("panel", "Show a panel and/or close all the other ones.<br />E.g. {<span class='jBashCmd'>panel closeall my_panel</span>}", GIMLI.panel);
jBash.registerCommand("p", "Show a panel and/or close all the other ones.<br />E.g. {<span class='jBashCmd'>panel closeall my_panel</span>}", GIMLI.panel);

// show debug stuff.
jBash.registerCommand("show", "Print out debug info for the given stuff.<br />E.g. {<span class='jBashCmd'>show items</span>}",
function(params)
{
	if(__defined(params[1]))
	{
		switch(params[1].toLowerCase())
		{
			case "items": GIMLI.instance.debugItems(); break;
			case "rooms": GIMLI.instance.debugRooms(); break;
			case "sounds": GIMLI.instance.debugSounds(); break;
			case "panels": GIMLI.instance.debugPanels(); break;
			default:
				log("Wrong parameter. Use <span class='jBashCmd'>items</span>, <span class='jBashCmd'>rooms</span>, <span class='jBashCmd'>sounds</span> or <span class='jBashCmd'>panels</span> to get a list of the given array.", LOG_USER);
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
