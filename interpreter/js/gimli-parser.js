/* General JSON data parser.
	by Benedict Jäggi in 2019
	
	including multible file loading per file (like header files)
	
	GIMLi + Game Induced Markup Language interpreter
	version number is combined with the gimli.js version.
	
	Your parser needs to incorporate this two functions:
	this.parseGML(json, rootPath)
	this.clear()
*/

// 0.7.01: forgot to incorporate the gmurl stuff into gimli-parser.js
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

// 0.6.40: removed bhelpers.js, including its functions here:
/* log something.
	Warning: THIS function has NO __ before!
	loglevels: 0: only user related stuff like crash errors and user information and such.
	1 = 0 with errors
	2 = 1 with warnings
	3 = 2 with debug
	4 = very much output, be aware.
*/
const LOG_USER = 0;
const LOG_ERROR = 1;
const LOG_WARN = 2;
const LOG_DEBUG = 3;
const LOG_DEBUG_VERBOSE = 4;

var log = function(text, loglevel = 0)
{
	if(log.loglevel>=loglevel)
	{
		var ll="";
		switch(loglevel)
		{
			case LOG_USER: ll="";break;
			case LOG_ERROR: ll='[ERROR]: ';break;
			case LOG_WARN: ll='[WARNING]: ';break;
			case LOG_DEBUG:
			case LOG_DEBUG_VERBOSE:
				ll='[DEBUG]: ';break;
			default: break;
		}
		console.log("> "+ll+text);
		log.array.push(ll+text);
		if(typeof(log.logfunction)=="function")
			log.logfunction(text, loglevel);
	}
};
log.loglevel = LOG_DEBUG;
// we push all log messages to this array, too.
log.array = [];
// maybe we set an external log function.
// it needs to have 2 parameters: text and loglevel.
log.logfunction=null;

/* Defined: Check if a variable is defined. Also works with associative array entries and such. */
function __defined(variable)
{
	if(typeof(variable)==="undefined")
		return false;
	return true;
}

/* Add a slash / to the directory string if there is none at the end.
	Warning: 	You need to separate the directory from the file before.
				It just adds a slash at the end if there is none,
				no matter if it is a file or not.
	Does not add a slash if the directory is "".
*/
function __addSlashIfNot(directory)
{
	var d = directory;
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

/* remove all "dir/../" combinations to get "unique" directories from each subfolder.
	E.g.: you will check for "test/test2" and you have "test/NOTEST/../test2" 
	It's the same but in another "wording". 
	This function gets "test/test2" out of the second one,
	so that it can be compared (is equal) with the first one.
	Useable if you want to check if a file is already loaded from another directory or such.
*/
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
		done = true;
		for(var i=0;i<arr.length;i++)
		{
			var a1=arr[i];
			if(a1!="../")
			{
				arr2.push(a1);	// push it to the array.
				dirpushed = true;
				firstdirpushed = true;
			}else{
				// it's ../, go one dir back.
				// but only if there is a dir before.
				if(dirpushed && firstdirpushed)
				{
					arr2.pop();	// take away the last entry.
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
	
	// recombine the directory.
	dir="";
	for(var i=0;i<arr.length;i++)
		dir+=arr[i];
	
	// check if it was shortened.
	if(dir!=longdir)
		log("Directory shortened: "+longdir+" to "+dir, LOG_DEBUG_VERBOSE);
	
	return dir;
}


/* Load a JSON file asyncronously and apply a function on the data after loading. 
	This function also sets a loadcounter. Each file loading = loadcounter -1.
	If it is done loading = loadcounter + 1.
	If the loadcounter is >= 0 after the loading, all files are loaded.
	You can wait for the loadcounter to be 0 with setTimeout or such.
	
	Like that:
	
	var AllLloadedInitFunction=function()
	{
		// wait until the loading is done.
		if(__loadJSON.loadCounter<0)
		{
			console.log("NOT DONE LOADING; Waiting..");
			setTimeout(AllLoadedInitFunction, 30);
			return;
		}
		
		console.log("All JSONS loaded.");
		... do your stuff here ...
	}
	
	__loadJson("file1", success1);
	__loadJSON("file2", success2);
	AllLoadedInitFunction();
	
*/
function __loadJSON(urlToFile, successFunction)
{
	__loadJSON.loadCounter = __loadJSON.loadCounter-1;
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
			__loadJSON.loadCounter+=1;
       	}
   	};
   	xhr.open("GET", urlToFile, true);
	xhr.responseType = "json";
   	xhr.send();
}
__loadJSON.loadCounter=0;

// Make all the value/array names in a json object upper case.
// returns a new json object with a copy of the old one but uppercase letters in the value names.
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
// ENDOF bhelpers include. 

//////////////////////////////////////////////////////////////////////////////////////////////////

// 0.6.05: New "external" parser.
var GMLParser = function()
{
	var me = this;
	var m_afterLoadFunction = null; // your function called after loading all the files.
	// This is the name with the array which holds your additional files.
	// You can change it with GMLParser.instance.setFileArrayName
	// remember that all json names will be converted to uppercase.
	var m_GMLFileArrayName = "GMLS";
	this.setFileArrayName = function(name) {m_GMLFileArrayName = name;};
	
	// array with all the files to load in it.
	// this is the only "internal" parser, because the GMLParser needs to know the file names.
	// this is "per" file, you can not load multible files with that parser directly but with references in your files themselves.
	var GMLfile = function(gmlurl)
	{
		this.gmurl = gmlurl;
		this.collected = false;
	}
	var m_gmlFileArray = [];

	// array with all the parsers in it.
	// you need to have a parseGML function in your parser.
	var parsers = [];
	this.parseGML = function(json, rootPath)
	{
		// get the gml filename array.
		log("Parsing GML [Path: "+rootPath+"]"/*+JSON.stringify(json)*/, LOG_DEBUG_VERBOSE);
		
		log("Converting array names to uppercase..", LOG_DEBUG_VERBOSE);
		var json2 = __jsonUpperCase(json);
		json = json2;
		
		if(json==null)
		{
			log("SEVERE ERROR: JSON for a GML file in "+rootPath+" is null", LOG_ERROR);
			return;
		}
	
		// 0.6.06: gml file collector in the parser.
		// get the gmls structure.
		var gmlArray = [];
		if(__defined(json[m_GMLFileArrayName]))
			gmlArray = json[m_GMLFileArrayName];
					
		// check if the entries already exist, else add them.
		for(var g=0;g<gmlArray.length;g++)
		{
			var gml = GMLurl.makeGMURL(gmlArray[g]);
			var innerfound = false;
			var gmlpath = "";
			for(var q=0;q<m_gmlFileArray.length;q++)
			{
				var chk=m_gmlFileArray[q].gmurl.getCombined();
				gmlpath = __shortenDirectory(__addSlashIfNot(rootPath)+gml.getCombined());
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

		// go through all the parsers and parse the gml.
		for(var i=0;i<parsers.length;i++)
		{
			parsers[i].parser.parseGML(json, rootPath);
		}
	}
	
	// data which holds the parser and its name.
	var parserData = function(gparser, gname)
	{
		this.parser = gparser;
		this.name = gname;
	}
	
	// add a parser.
	this.addParser=function(name, parser) 
	{
		var pd = new parserData(parser, name.toUpperCase());
		parsers.push(pd);
	}
	this.clearParsers=function() {parsers=[]};
	this.getParser=function(parserName) 
	{
		for(var i=0;i<parsers.length;i++)
		{
			if(parsers[i].name==parserName.toUpperCase())
				return parsers[i].parser;
		}
		return null;
	}
	
	// this is the main function you need to call after you added your gml parsers.
	this.parseFile=function(filename, afterloadfunction = null)
	{
		// get the new after loading function.
		m_afterLoadFunction = afterloadfunction;
		// get all the files and parse them here.
		// additional files will be added in the collect function,
		// and the parseGML function of this class.
		m_gmlFileArray=[];
		var gmurl = GMLurl.makeGMURL(filename);
		m_gmlFileArray.push(new GMLfile(gmurl));
		m_collectioncounter = 0;
		log("COLLECTOR: Starting with "+filename,LOG_DEBUG);
		GIMLI.showBlocker(true, "Loading "+filename);
		
		// clear all data.
		for(var i=0;i<parsers.length;i++)
		{
			parsers[i].parser.clear();
		}
		
		_collect();
	}
	
	// this is the main file collector.
	var m_collectioncounter = 0;
	var _collect = function()
	{
		m_collectioncounter++;
		log("NC: COLLECTION #"+m_collectioncounter+" / "+m_gmlFileArray.length+" entries to check.", LOG_DEBUG);
		
		var found = false;
		for(var i=0;i<m_gmlFileArray.length;i++)
		{
			var l = m_gmlFileArray[i];
			var filepath= l.gmurl.getCombined();
			if(l.collected==false) // load the stuff and break the loop.
			{
				log("NC: Collecting entry #"+i+" @ "+filepath, LOG_DEBUG);
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
					_collect();
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
			log("-------- NC: ENDOF COLLECTING GMLS ---------",LOG_DEBUG);

			if(typeof(m_afterLoadFunction)==="function")
				m_afterLoadFunction()
		}
	}
}
GMLParser.instance = new GMLParser();
GMLParser.addParser = function(name, parser) {GMLParser.instance.addParser(name, parser);};
GMLParser.parseFile = PARSEGMLFILE = function(filename, afterloadfunction=null) {GMLParser.instance.parseFile(filename, afterloadfunction);};
GMLParser.getParser = function(name) {return GMLParser.instance.getParser(name);}
