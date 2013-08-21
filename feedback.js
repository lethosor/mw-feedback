/*
 * MediaWiki article feedback tool
 */
jQuery(function($){
	var F = {};
	F.opts = {
	
	};
	try {
		$.extend(F.opts, JSON.parse($('#feedback-opts').first().text()||'{}'));
	}
	catch(e) {}
	
});
