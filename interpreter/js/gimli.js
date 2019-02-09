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
 
*/

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
		// TODO: show to user.
	}
};
log.loglevel = LOG_DEBUG;

var GIMLI = function()                       
{
	var me = this; // protect this from be this'ed from something other inside some brackets.
	
	var m_initpage = "";  // the gml file which was called on the init function.
	
	this.init = function(gmurl)
	{
		me.checkForFile(gmurl)
		m_initpage = me.makeGMURL(gmurl);
		me.loadGML(m_initpage);
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
		var success = function(data)
		{
			log("file check ok for "+urlToFile,LOG_DEBUG);
		}
		var failure=function(data)
		{
			log("File not found! or CORS. REMOVE THAT SHIT FROM THE INTERNET: CORS IS FOR NOTHING! "+data,LOG_USER);
		}
		
		fetch(urlToFile).then(success, failure);
	}
};
GIMLI.instance = new GIMLI();

GIMLI.init = function(gmurl) {GIMLI.instance.init(gmurl);};