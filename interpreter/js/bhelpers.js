/*
	benobi helpers.
	general functions to easy up your life.
	by Benedict Jäggi in 2019

	version 1.02: It's all tested by myself so I put it outta beta. :)
	
	because they are sooo general, I will use double-underscore for them.
	like jquerys $ you need to put __ before this stuff here.
*/

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
log.logfunction=null;

/* Defined: Check if a variable is defined. Also works with associative array entries and such. */
function __defined(variable)
{
	if(typeof(variable)==="undefined")
		return false;
	return true;
}

/* Get the value of a GET parameter.
	if there is no parameter with that name, 
	this function returns null.
	Use it like in php with $_GET(parametername) (round brackets instead of [] this ones.)
*/
function $_GET(parameterName) {
    var result = null,
        tmp = [];
    location.search
        .substr(1)
        .split("&")
        .forEach(function (item) {
          tmp = item.split("=");
          if (tmp[0] === parameterName) result = decodeURIComponent(tmp[1]);
        });
    return result;
}
// same in bhelpers syntax.
function __GET(parameterName) {return $_GET(parameterName);}

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

// DIRECTORY AND FILE OPERATIONS

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
