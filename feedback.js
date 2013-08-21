/*
 * MediaWiki article feedback tool
 */
jQuery(function($){
	var F = {ui:{}, page:{}};
	var PD=function(e){ // preventDefault shorthand
		if(e && 'preventDefault' in e && 'call' in e.preventDefault)
			e.preventDefault()
	};
	
	F.page.name = wgPageName.replace(/_/g, ' ');
	
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
	};
	
	F.save = function(e){PD(e);
		title = F.ui.f_title.val() || F.ui.f_title.attr('placeholder');
		text = F.ui.f_text.val();
		if (!text) {
			return F.save_error('Feedback is required!');
		}
		
		return true;
	};
	
	F.save_error = function(err){
		F.ui.error.text(err).fadeIn(200);
		return false;
	};
	
	F.ui.show = function(e){PD(e);
		F.ui.overlay.fadeIn(300);
		F.ui.screen.fadeIn(300);
	};
	
	F.ui.hide = function(e){PD(e);
		F.ui.overlay
		.add(F.ui.screen)
		.add(F.ui.error)
		.fadeOut(300);
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
	
	F.ui.f_title = $('<input>').attr({type:'text', placeholder:'Feedback for '+F.page.name})
	.appendTo(F.ui.screen).css({
		'font-size': '1.2em'
	});
	F.ui.f_text = $('<textarea>').appendTo(F.ui.screen).css({
		height:'50%',
		'font-size': '1em'
	}).attr({placeholder:'Feedback'});
	F.ui.f_text.add(F.ui.f_title).css({
		width: '95%',
		border: '1px solid #ccc',
		'border-radius': 2,
		color: '#333',
		margin: 6,
		'padding': 5
	});
	F.ui.watch = $('<input>').attr({type:'checkbox', id:'F-watch'}).appendTo(F.ui.screen)
	.css({
		'float':'left'
	}).prop('checked', F.opts.watch);
	F.ui.watch_label = $('<label for="F-watch">').text('Watch for changes')
	.insertAfter(F.ui.watch);
	if (!wgUserName) {
		F.ui.watch_label.hide();
		F.opts.watch = false;
	}
	F.ui.b_submit = $('<button>').text('Submit feedback').appendTo(F.ui.screen).click(F.save);
	F.ui.b_cancel = $('<button>').text('Cancel').appendTo(F.ui.screen).click(F.exit);
	F.ui.b_cancel.add(F.ui.b_submit).css({
		color: '#333',
		'background-color': '#ddd',
		border: 'none',
		'border-radius': 2,
		'float': 'right',
		'margin-right': 5,
		cursor: 'pointer',
		'font-size': '1em'
	});
	F.ui.error = $('<div>').css({color:'red', 'clear':'both'}).appendTo(F.ui.screen);
	
	F.setup();
	window.Feedback = F;
});
