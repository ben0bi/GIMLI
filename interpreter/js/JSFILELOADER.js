/******************************************
 *                                        *
 * GIT - Grenchen Institute of Technology *
 *                                        *
 ******************************************
 
     ben0biJSLoader.js
	
     by Beni Yager, 2018
     github.com/ben0bi/ben0biJSLoader.git
	 
	 Modified for GIMLI:
	 https://github.com/ben0bi/GIMLI.git
	 
	 (Renamed ben0biJSLoader to JSFILELOADER)
 */

var JSFILELOADER = function(configFilePath, asyncFunction)
{
	if(!configFilePath)
	{
		console.log("JSFileLoader ERROR: You need to specify a config file for loading the JS files.");
	}

	var m_func = null;
	var m_configFilePath = configFilePath;
	if(asyncFunction)
		m_func = asyncFunction;

	var m_maxCount = 0;	// how many paths are in the json?

	// load scripts recursive and call m_func at the end.
	var recLoadScript = function(json, recCount)
	{
		var val="";
		var valkey=""; // NEW: use JSFILE_[key] as id of the script.
		var cnt=0;

		// get the right path with the index recCount.
		for (var key in json) 
		{
		  	if(key!="//" && json.hasOwnProperty(key)) 
		  	{
				// val(ue) is the path.
				// key will be set as tag id.
		    		val = json[key];
				valkey = key;
				if(cnt>=recCount)
					break;
				cnt++;
		  	}
		}

		// check if it is already there.
		var larry = JSFILELOADER.loadedArray;
		var found = false;
		for(var i=0;i<larry.length;i++)
		{
			if(larry[i]==val)
			{
				found = true;
				break;
			}
		}

		// it's already loaded, get the next one.
		if(found)
		{
			rls(json, recCount);
			return;
		}

		// else load it in and THEN get the next one.
		larry.push(val);
		var script = document.createElement('script');
	//	console.log("l: "+val);
		script.onload=function()
		{
			rls(json, recCount);
		};
		script.id='JSFILE_'+valkey; // NEW: use the json key as id.
		script.src=val;
		document.head.appendChild(script);
	};

	// ANTISPAGETTHI CODE
	var rls = function(json, recCount)
	{
		if(recCount<m_maxCount-1) {
			recLoadScript(json, recCount+1);
		}else{
			if(typeof(m_func)==="function")
				m_func();
		}
	};

	var jsLoad = function()
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
					var maxCount=0;
					// count the paths
					for (var key in json) 
					{
				  		if(key!="//" && json.hasOwnProperty(key)) 
				  		{
							maxCount++;
						}
					}
					m_maxCount = maxCount;
					console.log("JS File Count: "+maxCount);
					recLoadScript(json,0);
        			} else {
					console.log("XHR Error: "+xhr.status);
				}
        	}
    	};
    	xhr.open("GET", m_configFilePath, true);
		xhr.responseType = "json";
    	xhr.send();
	};

	// LOAD
	jsLoad();
}
JSFILELOADER.loadedArray = new Array();
// Load files from a depth-1 json file.
JSFILELOADER.recursiveLoad = function(configFilePath, afterLoadFunction) {return new JSFILELOADER(configFilePath, afterLoadFunction);};

