/* General JSON data parser.
	by Benedict Jäggi in 2019
	
	including multible file loading per file (like header files)
	
	GIMLi + Game Induced Markup Language interpreter
	version number is combined with the gimli.js version.
	
	Your parser needs to incorporate this two functions:
	this.parseGML(json, rootPath)
	this.clear()
*/

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
			
			// 0.5.19: Doing the rest.
/*			if(m_roomByURL!="")
			{		
				// 0.5.22: check if the url room exists.
				var room = __findRoom(m_roomByURL);
				if(room==null)
				{
					log("Room ["+m_roomByURL+"] from URL not found!",LOG_WARN);
					log("Jumping to original start room ["+m_startRoomIntern+"].", LOG_WARN);
					me.jumpToStartRoom();
				}else{
					me.jumpToRoom(m_roomByURL);
				}
			}else{
				me.jumpToStartRoom();
			}
			setTimeout(GIMLI.hideConsole,750);
*/
		}

	}
}
GMLParser.instance = new GMLParser();
GMLParser.addParser = function(name, parser) {GMLParser.instance.addParser(name, parser);};
GMLParser.parseFile = PARSEGMLFILE = function(filename, afterloadfunction=null) {GMLParser.instance.parseFile(filename, afterloadfunction);};
GMLParser.getParser = function(name) {return GMLParser.instance.getParser(name);}
