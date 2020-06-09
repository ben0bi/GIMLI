#####################
#   GIMLI-python    #
# By Benedict Jäggi #
#   hand made in    #
#   Switzerland     #
##############<3#####

#####################
# ROOT Parser       #
#####################

# Parses the Entities out of a GML file and loads additional GML files.

import json

gmldata = {}
gmlfiles = {}
gmlloadedfiles = {}

def PARSEGML(filename):
	global gmlloadedfiles
	if isLoadedGML(filename)==1:
		return
# TODO: add filename to gmlloadedfiles
	with open(filename) as json_file:
		data = json.load(json_file)
		for gml in data['GMLS']:
			PARSEGML(gml)

def isLoadedGML(filename):
	global gmlloadedfiles {}
	for gml in gmlloadedfiles:
		if gml==filename:
			return 1
	return 0
		
