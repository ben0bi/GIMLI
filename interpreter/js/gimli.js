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
const GIMLIVERSION = "0.0.5a";

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
		console.log("> "+text);
		jBash.instance.AddLine(text);
		// TODO: show to user.
	}
};
log.loglevel = LOG_DEBUG;

// fetch a file and do some functions on it.	
async function asyncFetch(urlToFile, success, failure)
{
	await fetch(urlToFile).then(success, failure);
};

// The GIML-Interpreter
var GIMLI = function()                       
{
	var me = this; // protect this from be this'ed from something other inside some brackets.
	
	var m_initpage = "";  // the gml file which was called on the init function.
	
	this.init = function(gmurl)
	{
		__createMainWindow();
		var checkurl = me.makeGMURL(gmurl);
		var d = me.checkForFile(checkurl)
		if(d)
		{
			m_initpage = checkurl;
			me.loadGML(m_initpage);
		}
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
	this.loadGML = function(gmurl)
	{
		log("Loading GML: "+gmurl, 0);
	};

	// Check if aa file exists.
	this.checkForFile=function(urlToFile)
	{
		var fileFound = false;
		var success = function(data)
		{
			log("file check ok for "+urlToFile,LOG_DEBUG);
			fileFound = 1;
		}
		var failure=function(data)
		{
			log("File not found! or CORS. REMOVE THAT SHIT FROM THE INTERNET: CORS IS FOR NOTHING! "+data,LOG_USER);
			fileFound = 0;
		}
		
		// try to get the file.
		asyncFetch(urlToFile, success, failure);
		return fileFound;
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
		var elconsole = jQuery.getNewDiv('','gimli-jbash-window', 'gimli-pixelperfect');
		var elconsole_outer = jQuery.getNewDiv('', 'gimli-jbash-outer-window', 'gimli-pixelperfect');
		var elhidebutton = jQuery.getNewJSButton('&#9049', "GIMLI.hideConsole();", 'gimli-button-hide-console', 'gimli-button');
		elconsole_outer.append(elconsole)
		elconsole_outer.append(elhidebutton);
		el.append(elconsole_outer);
		
		var el2= jQuery.getNewDiv('<a href="https://github.com/ben0bi/GIMLI/">GIML-Interpreter</a> v'+GIMLIVERSION+' (JS-Version) by Benedict Jäggi in 2019 | <a href="javascript:" onclick="GIMLI.showConsole();">console</a>', 'gimli-footer-window', 'gimli-pixelperfect');
		jQuery.appendElementTo('head', css2);
		jQuery.appendElementTo('head', css);
		
		jQuery.appendElementTo('body', el);
		jQuery.appendElementTo('body', el2);
		
		jBash.initialize("#gimli-jbash-window", "");
		jBash.instance.Parse("cmd");
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
