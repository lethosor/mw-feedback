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
				case 'tab':
					F.ui.tab.show();
					break;
				case 'sectionlink':
					$('.F-section-link').show();
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
		var section = $(this).data('section')
		if (section) {
			F.ui.f_section.find('option').filter(function(i, e){
				return $(e).text() == section
			}).prop('selected', true);
		}
		return true;
	};
	
	F.reset = function(e){PD(e);
		F.ui.form.find('input[type=text], textarea').val('');
	};
	
	F.exit = function(e){PD(e);
		if (!F.exit.enabled) {
			return false;
		}
		F.ui.hide();
		return true;
	};
	F.exit.enabled = true;
	
	F.save = function(e, captcha){PD(e);
		F.ui.error.fadeOut(200);
		var text = F.ui.f_text.val();
		if (!text) {
			return F.save_error('Feedback is required!');
		}
		// Remove trailing whitespace
		text = text.replace(/\s+$/, '') + ' --~~~~';
		text = ('<div style="color:#888;padding-left:2em;">$1</div>\n'.replace(/\$1/g,
			Number(F.ui.f_section.val()) ? 'Section: [[{{subst:SUBJECTPAGENAME}}#$1|$1]]'.replace(/\$1/g, F.ui.f_section.find(':selected').text())
				:'No section specified'
		)) + text;
		F.ui.form.hide();
		F.ui.close_link.hide();
		F.ui.progress.show();
		F.exit.enabled = false;
		F.ui.screen.animate({height: '15%'}, 400);
		
		var edit_token = mw.user.tokens.values.editToken,
			watch_token = mw.user.tokens.values.watchToken,
			title = (F.ui.f_title.val() ?
				 'Feedback: '+F.ui.f_title.val() :
				 'Feedback from '+(window.wgUserName||'anonymous user')),
			api_path = wgScriptPath + '/api.php',
			query = {
				action: 'edit',
				format: 'json',
				section: 'new',
				text: text,
				summary: title,
				token: edit_token
			},
			p = F.ui.progress.html('<p>Submitting feedback...</p>');
		$.extend(query, captcha);
		if (F.opts.watch) {
			query.watch = 1;
		}
		// Obtain talk page title
		$.get(api_path, {action:'parse', format:'json', title:wgPageName,
		      text:'{{TALKPAGENAME}}'}, function(d){
			query.title = $('<span>').html(d.parse.text['*']).text().replace(/\n/g, '');
			$.post(api_path, query, function(d){
				if ('captcha' in d.edit) {
					F.save_captcha(query, d);
					return;
				}
				p.html('<p style="color:green">Thank you!</p>');
				F.exit.enabled = true;
				setTimeout(F.exit, 500);
				F.reset();
			});
		});
		return true;
	};
	
	F.save_captcha = function(q, d){
		if (!('captcha' in d.edit)) {
			return false;
		}
		F.ui.screen.stop().animate({height: '50%'}, 400);
		F.exit.enabled = true;
		switch (d.edit.captcha.type) {
			case 'recaptcha':
				$('<p>').appendTo(F.ui.progress)
				.html('To prevent spam, please type the words you see in the box below.');				$('<div id="F-recaptcha">').appendTo(F.ui.progress);
				Recaptcha.create(d.edit.captcha.key, 'F-recaptcha');
				$('<a href="#F-exit">Cancel</a>').appendTo(F.ui.progress);
				$('<a href="#">OK</a>').click(function(e){PD(e);
					F.exit.enabled = false;
					F.ui.screen.animate({height: '15%'}, 400);
					F.save(0, {
						captchaid: $('#recaptcha_challenge_field').val(),
						captchaword: $('#recaptcha_response_field').val()
					});
				}).appendTo(F.ui.progress).css('padding-left', '1em');
				break;
			default:
				return false;
		}
		return true;
	};
	
	F.save_error = function(err){
		F.ui.error.text(err).fadeIn(200);
		return false;
	};
	
	F.ui.show = function(e){PD(e);
		F.ui.overlay.fadeIn(300);
		F.ui.screen.fadeIn(300).css({height: '50%'});
		F.ui.tab.addClass('selected');
		F.ui.form.show();
		F.ui.close_link.show();
		F.ui.progress.hide();
		F.exit.enabled = true;
	};
	
	F.ui.hide = function(e){PD(e);
		F.ui.overlay
		.add(F.ui.screen)
		.add(F.ui.error)
		.fadeOut(300);
		F.ui.tab.removeClass('selected');
	};
	
	F.ui.tab = $('<li>').html('<span><a href="#F-init">Leave feedback</a><span>')
		.insertAfter('#left-navigation ul:nth(0) li:last').hide();
	
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
	
	$('body').on('click', 'a[href=#F-init]', F.init);
	$('body').on('click', 'a[href=#F-exit]', F.exit);
	
	F.ui.screen.append('<h3>Feedback</h3>');
	F.ui.form = $('<div>').appendTo(F.ui.screen).css({height:'100%'});
	F.ui.progress = $('<div>').appendTo(F.ui.screen).css({height:'100%'}).hide()
		.css({'text-align':'center'});
	
	F.ui.f_title = $('<input>').attr({type:'text', placeholder:'Title', title:'Title'})
	.appendTo(F.ui.form).css({
		'font-size': '1.2em'
	});
	F.ui.f_text = $('<textarea>').appendTo(F.ui.form).css({
		height:'50%',
		'font-size': '1em'
	}).attr({placeholder:'Feedback (required)', title:'Feedback (required)'});
	F.ui.f_section = $('<select>').insertBefore(F.ui.f_title).css({
		'float': 'left'
	}).attr('id', 'F-section');
	F.ui.f_section.append($('<option>').text('(No section)').attr({value:0}));
	
	$('#mw-content-text').children('h1,h2,h3,h4,h5,h6').each(function(i, e){
		var section = $(e).find('.mw-headline').text();
		F.ui.f_section.append($('<option>').text(section).attr({value:1}));
		$(e).find('.editsection').prepend(
			$('<span>').text('[').append(
				$('<a>').attr('href','#F-init').text('Leave feedback').data({section:section})
			).append('] ').addClass('F-section-link').hide()
		)
	});
	
	F.ui.f_text.add(F.ui.f_title).css({
		width: '95%',
		border: '1px solid #ccc',
		'border-radius': 2,
		color: '#333',
		margin: 6,
		'padding': 5,
		'font-family': 'sans-serif'
	});
	
	$('<div>').css('clear','both').insertAfter(F.ui.f_text);
	
	F.ui.watch = $('<input>').attr({type:'checkbox', id:'F-watch'}).appendTo(F.ui.form)
	.css({
		'float':'left'
	}).prop('checked', F.opts.watch);
	F.ui.watch_label = $('<label for="F-watch">').text('Watch for changes')
	.insertAfter(F.ui.watch);
	if (!wgUserName) {
		F.ui.watch.hide();
		F.ui.watch_label.hide();
		F.opts.watch = false;
	}
	F.ui.b_submit = $('<button>').text('Submit feedback').appendTo(F.ui.form).click(F.save);
	F.ui.b_cancel = $('<button>').text('Cancel').appendTo(F.ui.form).click(F.exit);
	F.ui.b_cancel.add(F.ui.b_submit).css({
		'float': 'right',
		'background-color': '#ddd',
		cursor: 'pointer',
	}).add(F.ui.f_section).css({
		border: '1px solid #ddd',
		color: '#333',
		'border-radius': 2,
		'margin-right': 5,
		'font-size': '1em',
	});
	F.ui.error = $('<div>').css({color:'red', 'clear':'both'}).hide().appendTo(F.ui.form);
	
	F.setup();
	window.Feedback = F;
});
