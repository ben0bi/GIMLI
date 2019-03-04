/* jquery additions.
	by benobi, 2019aD
*/

// append a jquery element (el) to other jquery element/s (id or class name).
jQuery.appendElementTo=function(contentIDorClass, jqElement)
{
	$(contentIDorClass).each(function() {$(this).append(jqElement);});
};

// create a new DOM element with given tagname, id and classes.
jQuery.getNewElement=function(tagname='div',id='', classes='')
{
	var el = $(document.createElement(tagname));
	if(id!='')
		el.attr('id', id);
	if(classes!='')
		el.attr('class', classes);
	return el;
};

// create a new A tag which calls a JS function on click.
jQuery.getNewJSButton=function(buttonContent,jsFunctionName, id='',classes='')
{
	var el = jQuery.getNewLink('javascript:',buttonContent,id,classes);
	$(el).attr('onclick', jsFunctionName);
	return el;
};

// create a new A tag with a normal href linking.
jQuery.getNewLink=function(url,text, id='',classes='')
{
	var el = jQuery.getNewElement('a',id,classes);
	$(el).attr('href',url);
	$(el).html(text);
	return el;
};

// create a new div with given  content, id and classes.
jQuery.getNewDiv=function(content='',id='', classes='')
{
	var el = jQuery.getNewElement('div',id,classes);
	if(content!='')
		el.html(content);
	return el;
};

// create an input with content or placeholder.
jQuery.getNewInput=function(content, placeholder='', id='', classes='')
{
	var el=jQuery.getNewElement('input',id,classes);
	$(el).attr('placeholder', placeholder);
	$(el).val(content);
	return el;
}

// get the real height of an element.
// including padding and margin.
jQuery.getRealHeight=function(contentID)
{
	var c = $('#'+contentID);
	var h = c.height();
	var mt = parseInt(c.css('margin-top'));
	var mb = parseInt(c.css('margin-bottom'));
	var pt = parseInt(c.css('padding-top'));
	var pb = parseInt(c.css('padding-bottom'));
	
	return h + mt + mb + pt + pb;
	
}