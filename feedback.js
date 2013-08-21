/*
 * MediaWiki article feedback tool
 */
jQuery(function($){
	var F = {ui:{}};
	var PD=function(e){ // preventDefault shorthand
		if(e && 'preventDefault' in e && 'call' in e.preventDefault)
			e.preventDefault()
	};
	F.opts = {
		'watch': true,
		'triggers': [['section', 'Feedback']]
	};
	$('#feedback-opts').each(function(i,e){
		try {
			$.extend(F.opts, JSON.parse($(e).text()||'{}'));
		}
		catch(e) {}
	});
	
	F.enabled = !!$('#feedback-enable').length;
	
	F.log = function(){
		args = [].slice.call(arguments);
		args.unshift('Feedback reporter:');
		if ('console' in window && 'log' in console) {
			console.log.apply(console, args);
		}
	};
	
	F.setup = function(){
		if (!F.enabled) {
			return false;
		}
		$.each(F.opts.triggers, function(i, trigger){
			switch (trigger[0].toLowerCase()) {
				case 'section':
					$('body').on('click', 'a[href=#'+trigger[1]+']', F.init);
					break;
				default:
					F.log('Unknown trigger type:', trigger[0])
			}
		});
		return true;
	};
	
	F.init = function(e){PD(e);
		if (!F.enabled) {
			return false;
		}
		F.ui.show();
		return true;
	};
	
	F.exit = function(e){PD(e);
		F.ui.hide();
		return true;
	}
	
	F.ui.show = function(e){PD(e);
		F.ui.overlay.fadeIn(300);
		F.ui.screen.fadeIn(300);
	};
	
	F.ui.hide = function(e){PD(e);
		F.ui.overlay.fadeOut(300);
		F.ui.screen.fadeOut(300);
	};
	
	F.ui.overlay = $('<div>').css({
		top:0, left:0, width:'100%', height:'100%', position:'fixed',
		'z-index': 1000, 'background-color': 'rgba(128,128,128,0.5)'
	}).hide().appendTo('body').click(F.exit);
	
	F.ui.screen = $('<div>').css({
		top:'25%', left:'25%', width:'50%', height:'50%',
		position:'fixed', 'z-index': 1000, 'background-color':'white',
		'border-radius': 4, padding: '1em'
	}).hide().appendTo('body');
	
	F.ui.close_link = $('<a>').attr('href','#F-exit').text('Close').css({
		color:'red', 'float':'right'
	}).appendTo(F.ui.screen);
	
	$('body').on('click', 'a[href=#F-exit]', F.exit);
	
	F.ui.screen.append('<h3>Feedback</h3>');
	
	
	F.setup();
	window.Feedback = F;
});
