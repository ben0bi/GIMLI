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
 
 needs jQuery.
 See the GIMLI-JSFILES.json in the config dir.
 
*/
const GIMLIVERSION = "0.0.9a";

// log something.
// loglevels: 0: only user related stuff like crash errors and so.
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
		// TODO: show to user.
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
	this.setImage=function(imageName) {m_imageFile = imageName;}
	this.getInitialHTML = function() 
	{
		return '<img src="'+m_imageFile+'" class="gimli-image" style="position: absolute; top: \''+posY+'px\'; left: \''+posX+'px\'>';
	};
};

// a room in the giml system.
var GIMLroom = function()
{
	var m_roomName ="";
	var m_internName = "";
	var m_items = [];
	this.addItem = function(item) {m_items.push(item);};	
};

// The GIML-Interpreter
var GIMLI = function()                       
{
	var me = this; // protect this from be this'ed from something other inside some brackets.
	
	var m_initpage = "";  // the gml file which was called on the init function.
	var m_actualRoomIntern = ""; // the actual room intern name.
	
	this.init = function(gmurl)
	{
		__createMainWindow();
		var checkurl = me.makeGMURL(gmurl);
		me.loadJSONFile(checkurl, function(json) {
			m_initpage = checkurl;
			me.parseGML(json);
		});
	};
	
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
		log("MakeGMLUrl: "+r,LOG_DEBUG)
		return r;
	};
	
	// load a gml json file.
	this.parseGML = function(json)
	{
		log("Parsing GML: "+JSON.stringify(json), LOG_DEBUG);
		
		log("Converting array names to uppercase..", LOG_DEBUG);
		var json2 = __jsonUpperCase(json);
		
		m_actualRoomIntern = json2['STARTLOCATION'];
		if(typeof(m_actualRoomIntern)==="undefined")
			m_actualRoomIntern = "not found";
		log ("GML start location: "+m_actualRoomIntern, LOG_DEBUG);
	};
	
	// make all the array names in a json object upper case.
	function __jsonUpperCase(obj) {
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
	
	// create the div where the action goes. :)
	var __createMainWindow = function()
	{
		var body = $('body');
		var cssfile = 'css/gimli-base.css';
		var cssfile2="css/jbash-base.css"
		var css= '<link rel="stylesheet" type="text/css" href="'+cssfile+'">';
		var css2= '<link rel="stylesheet" type="text/css" href="'+cssfile2+'">';
		
		var el = jQuery.getNewDiv('','gimli-main-window', 'gimli-pixelperfect');
		var elconsole = jQuery.getNewDiv('','gimli-jbash-window', '');
		var elconsole_outer = jQuery.getNewDiv('', 'gimli-jbash-outer-window', '');
		var elhidebutton = jQuery.getNewJSButton('&#9049', "GIMLI.hideConsole();", 'gimli-button-hide-console', 'gimli-button');
		elconsole_outer.append(elconsole)
		elconsole_outer.append(elhidebutton);
		el.append(elconsole_outer);
		
		var el2= jQuery.getNewDiv('<a href="https://github.com/ben0bi/GIMLI/">GIML-Interpreter</a> v'+GIMLIVERSION+' (JS-Version) by Benedict Jäggi in 2019 | <a href="javascript:" onclick="GIMLI.showConsole();">console</a>', 'gimli-footer-window', 'gimli-pixelperfect');
		jQuery.appendElementTo('head', css2);
		jQuery.appendElementTo('head', css);
		
		jQuery.appendElementTo('body', el);
		jQuery.appendElementTo('body', el2);
		
		// initialize the console.
		jBash.initialize("#gimli-jbash-window", "");
		// parse the cmd-Command to show commands.
		jBash.instance.Parse("cmd");
		// hide the console in front of the user. :)
		//setTimeout(GIMLI.hideConsole,750);
	}
};
GIMLI.instance = new GIMLI();

// Initialize the GIMLI engine.
GIMLI.init = function(gmurl) {GIMLI.instance.init(gmurl);};

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
