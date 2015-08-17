'use strict';

var StylieNotification = require('stylie.notifications'),
	StylieModals = require('stylie.modals'),
	Formie = require('formie'),
	classie = require('classie'),
	moment = require('moment'),
	validatejs = require('validate-js'),
	checkPasswordStrength = require('./password_complexity'),
	io = require('socket.io-client'),
	socket,
	install_formie,
	PeriodicModal,
	install_form_button,
	use_admin_option,
	admin_config,
	adminConsoleElementContent,
	acp,
	// installadmin,
	// installform,
	// consoleOutput,
	open_modal_buttons;

var openModalButtonListener = function (e) {
	e.preventDefault();
	// console.log(e.target)
	// console.log(e.target.getAttribute('data-pfmodal-id'))
	PeriodicModal.show(e.target.getAttribute('data-id'));
	return false;
};

window.showStylieNotification = function (options) {
	var ttl = (typeof options.ttl !== 'undefined') ? options.ttl : 7000;
	new StylieNotification({
		message: options.message,
		ttl: ttl,
		wrapper: options.wrapper || document.querySelector('main'),
		layout: 'growl',
		effect: 'scale',
		type: options.type, // notice, warning, error or success
		onClose: options.onClose || function () {}
	}).show();
};

var formErrorsOnValidation = function (options) {
	var errorMessages = '<ul>';
	for (var v = 0; v < options.errors.length; v++) {
		classie.add(options.errors[v].element, 'ts-input-error');
		errorMessages += '<li>' + options.errors[v].message + '</li>';
	}
	errorMessages += '</ul>';
	window.showStylieNotification({
		message: errorMessages,
		type: 'error',
		ttl: 10000
	});
};

var show_admin_options = function ( /*event*/ ) {
	console.log('use_admin_option', use_admin_option.value);
	if (use_admin_option.value === 'no-admin') {
		classie.add(admin_config, 'ts-hidden');
	}
	else {
		classie.remove(admin_config, 'ts-hidden');
	}
};

window.showErrorNotificaton = function (options) {
	options.layout = 'growl';
	options.effect = 'jelly';
	options.ttl = false;
	options.type = 'error';
	window.showStylieNotification(options);
};

var install_button_handler = function (returnBool) {
	var validatorInstallPeriodic = new validatejs(install_formie.options.form, [{
		name: 'password',
		depends: 'checkIfUsingAdmin',
		display: 'Password',
		rules: 'required|callback_check_password_strength'
	}, {
		name: 'passwordconfirm',
		depends: 'checkIfUsingAdmin',
		display: 'Confirm Password',
		rules: 'required|callback_passwordconfirm|min_length[8]|matches[password]'
	}, {
		name: 'username',
		depends: 'checkIfUsingAdmin',
		display: 'Username',
		rules: 'required|min_length[1]'
	}, {
		name: 'email',
		depends: 'checkIfUsingAdmin',
		display: 'Email',
		rules: 'required|callback_check_email_format'
	}], function (errors) {
		if (errors.length > 0) {
			formErrorsOnValidation({
				errors: errors
			});
			if (typeof returnBool === 'boolean') {
				return false;
			}
		}
		else {
			install_formie.submit();
			return true;
		}
	}).setMessage('required', 'Please provide your %s.');

	var passwordComplexityErrorMessage = 'Please ensure your password meets the following criteria:<br /><ul><li>At least 8 characters in length</li><li>At least 1 uppercase letter</li><li>At least 1 lowercase letter</li><li>At least 1 number</li></ul>';

	validatorInstallPeriodic.registerCallback('check_password_strength', function (val) {
		if (install_formie.options.form.querySelector('#install-admin-select').value === 'no-admin') {
			return true;
		}
		else if (checkPasswordStrength(val, 'medium')) {
			return true;
		}
		else {
			return false;
		}
	}).setMessage('check_password_strength', passwordComplexityErrorMessage);

	validatorInstallPeriodic.registerCallback('passwordconfirm', function (value) {
			if (install_formie.options.form.querySelector('#install-admin-select').value === 'no-admin') {
				return true;
			}
			else if (value === '') {
				return false;
			}
			else {
				return true;
			}
		})
		.setMessage('passwordconfirm', 'Please confirm your Password.');
	validatorInstallPeriodic.registerCallback('check_email_format', function (value) {
			console.log('check_email_format value', value);
			if (install_formie.options.form.querySelector('#install-admin-select').value === 'no-admin') {
				return true;
			}
			else if (value === '') {
				return false;
			}
			else if (value.match(/^([^@\s]+)@((?:[-a-z0-9]+\.)+[a-z]{2,})$/i) === null) {
				return false;
			}
			else {
				return true;
			}
		})
		.setMessage('check_email_format', 'Please provide a valid Email Address.');

	validatorInstallPeriodic.registerConditional('checkIfUsingAdmin', function (field) {
		return use_admin_option.value !== 'no-admin';
	});

	return validatorInstallPeriodic._validateForm();
};

var initFormieElement = function () {
	install_formie = new Formie({
		ajaxformselector: '#install_form',
		headers: {
			// 'customheader': 'customvalue'
		},
		queryparameters: {
			format: 'json'
		},
		beforesubmitcallback: function ( /* event , formelement */ ) {
			// console.log(event, formelement);
			classie.remove(acp, 'ts-hidden');
			window.showStylieAlert({
				message: 'Installing Periodic in the background, sit tight'
			});
		},
		successcallback: function (response) {
			console.log('successcallback response.body', response.body);
			var res = response.body,
				errorTTL = 15000;
			if (res.result === 'error') {
				if (res.data.error === 'you already have an account') {
					res.data.error = 'It looks like you already have an account, <a href="/login" style="color:black;">click here</a> to login';
				}
				else if (res.data.error === 'Password does not meet complexity requirements') {
					res.data.error = 'Please ensure your password meets the following criteria:<br /><ul><li>At least 8 characters in length</li><li>At least 1 uppercase letter</li><li>At least 1 lowercase letter</li><li>At least 1 number</li></ul>';
				}
				// else /*if (Object.keys(res.data.error).length <= 1)*/ {
				// 	res.data.error = 'We\'re sorry, there has been an error processing your application. Please <a href="/contact" style="color:black;">contact us</a>';
				// 	errorTTL = 200000;
				// }
				window.showStylieNotification({
					message: res.data.error,
					type: 'error',
					ttl: errorTTL
				});
			}
			else {
				console.log('installing');
			}
		},
		errorcallback: function (error, response) {
			var res = JSON.parse(response.text),
				errortext;
			console.log('errorcallback error', error, 'res', res);
			console.log(' response.error', response.error);
			if (res.data && typeof res.data.error === 'string' && res.data.error === 'Password does not meet complexity requirements') {
				errortext = 'Please ensure your password meets the following criteria:<br /><ul><li>At least 8 characters in length</li><li>At least 1 uppercase letter</li><li>At least 1 lowercase letter</li><li>At least 1 number</li></ul>';
			}
			else if (res.data && typeof res.data.error === 'string') {
				errortext = 'Sorry, unexpected error' + res.data.error;

			}
			else {
				errortext = 'Sorry, unexpected error: ' + response.error;
			}
			window.showStylieNotification({
				message: errortext,
				type: 'error',
				ttl: 200000
			});
		}
	});
	window.install_formie = install_formie;
};

window.showStylieAlert = function (options) {
	var sendOSAlert = function (options) {
		var osAlert;
		try {
			var notificationDiv = document.createElement('div');
			notificationDiv.innerHTML = options.message;
			osAlert = new window.Notification('New ' + window.periodic.name + ' alert', {
				body: notificationDiv.textContent,
				icon: '/favicon.png',
			});
		}
		catch (e) {
			console.warn('OS/Browser does not support Notifications', osAlert);
		}
		return osAlert;
	};
	window.shownStylieNotification = new StylieNotification({
		message: options.message,
		ttl: (typeof options.ttl === 'boolean') ? options.ttl : 7000,
		wrapper: options.wrapper || document.querySelector('main'),
		layout: options.layout || 'growl',
		effect: options.effect || 'slide',
		type: options.type, // notice, warning, error or success
		onClose: options.onClose || function () {}
	}).show();

	if (window.Notification) {
		if (window.Notification.permission !== 'granted') {
			window.Notification.requestPermission(function (permission) {
				if (permission === 'granted') {
					sendOSAlert(options);
				}
			});
		}
		else {
			sendOSAlert(options);
		}
	}
};

var logToAdminConsole = function (data) {
	var logInfoElement = document.createElement('div'),
		adminMessageLevel = document.createElement('span'),
		adminMessageMessage = document.createElement('span'),
		adminMessageMeta = document.createElement('div'),
		// acc = document.querySelector('#ts-admin-console-content'),
		loglevel = data.level || 'log';
	classie.add(adminMessageMeta, 'ts-sans-serif');

	adminMessageLevel.innerHTML = moment().format('llll ') + ' - (' + loglevel + ') : ';
	if (typeof data === 'string') {
		adminMessageMessage.innerHTML = data;
		adminMessageMeta.innerHTML = JSON.stringify({}, null, ' ');
	}
	else {
		adminMessageMessage.innerHTML = data.msg;
		adminMessageMeta.innerHTML = JSON.stringify(data.meta, null, ' ');
	}
	logInfoElement.appendChild(adminMessageLevel);
	logInfoElement.appendChild(adminMessageMessage);
	logInfoElement.appendChild(adminMessageMeta);
	adminConsoleElementContent.appendChild(logInfoElement);
	acp.scrollTop = acp.scrollHeight;

	// if (acc && acc.childNodes && acc.childNodes.length > 10) {
	// 	//console.log('isClearingConsole', isClearingConsole);
	// 	isClearingConsole = true;
	// 	for (var x = 0; x < (acc.childNodes.length - 10); x++) {
	// 		acc.removeChild(acc.childNodes[x]);
	// 	}
	// 	var t = setTimeout(function () {
	// 		isClearingConsole = false;
	// 		//console.log('setTimeout isClearingConsole', isClearingConsole);
	// 		clearTimeout(t);
	// 	}, 5000);
	// }
};


var initServerSocketCallback = function () {
	var t;
	socket = io();
	window.adminSocket = socket;
	// socket = io(window.location.hostname + ':' + window.socketIoPort);
	// Whenever the server emits 'user joined', log it in the chat body
	socket.on('log', function (data) {
		logToAdminConsole(data);
	});
	socket.on('connect', function () {
		logToAdminConsole('connected socket');
	});
	socket.on('disconnect', function () {
		logToAdminConsole('disconnected socket');
		t = setTimeout(function () {
			window.StylieNotificationObject.dismiss();
		}, 500);
		// window.StylieNotificationObject.dismiss();
		window.showStylieAlert({
			message: 'Shutting down application and restarting Periodic. (' + new Date() + ')'
		});
	});
	socket.on('reconnect', function () {
		logToAdminConsole('reconnected socket');
		window.StylieNotificationObject.dismiss();
		window.showStylieAlert({
			message: 'Periodic application restarted.(' + new Date() + ')'
		});
		clearTimeout(t);
	});
	socket.on('error', function () {
		logToAdminConsole('socket error');
	});

	socket.on('server_callback', function (data) {
		var functionName = data.functionName,
			serverCallbackFn = window[functionName];

		if (typeof serverCallbackFn === 'function') {
			serverCallbackFn(data.functionData);
		}
	});
};



var elementSelectors = function () {
	open_modal_buttons = document.querySelectorAll('.ts-toottip.pop-tooltip');
	use_admin_option = document.querySelector('#install-admin-select');
	install_form_button = document.querySelector('#install_periodicjs_button');
	admin_config = document.querySelector('#admin-install-info');
	adminConsoleElementContent = document.querySelector('#adminConsoleElementContent');
	acp = document.querySelector('#output-log-container');
};

var elementEventListeners = function () {
	for (var q = 0; q < open_modal_buttons.length; q++) {
		open_modal_buttons[q].addEventListener('click', openModalButtonListener, false);
	}
	install_form_button.addEventListener('click', install_button_handler, false);
	use_admin_option.addEventListener('change', show_admin_options, false);
};


var init = function () {
	elementSelectors();
	elementEventListeners();
	PeriodicModal = new StylieModals({});
	initFormieElement();
	initServerSocketCallback();
	window.PeriodicModal = PeriodicModal;
	window.StylieNotification = StylieNotification;
};

window.addEventListener('load', init, false);

// var showadminoptions = function(e){
// 	var eTarget = e.target;
// 	if(eTarget.value==='true'){
// 		document.getElementById('admin-install-info').style.display='block';
// 	}
// 	else{
// 		document.getElementById('admin-install-info').style.display='none';
// 	}
// };

// var installformclick = function(e){
// 	var eTarget = e.target;
// 	if(eTarget.getAttribute('class') && eTarget.getAttribute('class').match('pop-tooltip')){
// 		var modalelement = document.getElementById(eTarget.getAttribute('data-id'));
// 		window.silkscreenModal.showSilkscreen(modalelement.getAttribute('data-title'),modalelement,14,'default');
// 	}
// };

// var getConsoleOutput = function(){
// 	var t = setInterval(function(){
// 				getOutputFromFile();
// 			},2000),
// 			otf,
// 			cnt=0,
// 			lastres='outputlog',
// 			MAXLOGREQUESTS = 100,
// 			getRequest = '/install/getlog';
// 	consoleOutput.innerHTML='';

// 	var getOutputFromFile = function(){
// 		request
// 			.get(getRequest)
// 			.set('Accept', ' text/plain')
// 			.end(function(error, res){
// 				// console.log('made request',cnt, error,res);

// 				if(res && res.error){
// 					window.ribbonNotification.showRibbon( res.error.message || res.text ,8000,'error');
// 					// console.log('error in ajax for file log data');
// 					try{
// 						if((res && res.error) || cnt >MAXLOGREQUESTS){
// 							clearTimeout(t);
// 						}
// 					}
// 					catch(e){
// 						console.warn('error',e);
// 					}
// 				}
// 				if(error){
// 					window.ribbonNotification.showRibbon( error.message || res.text ,8000,'error');
// 					// console.log('error in ajax for file log data');
// 					try{
// 						if((res && res.error) || cnt >MAXLOGREQUESTS){
// 							clearTimeout(t);
// 						}
// 					}
// 					catch(e){
// 						console.warn('error',e);
// 					}
// 				}
// 				else{
// 					if(cnt>MAXLOGREQUESTS){
// 						console.warn('made '+MAXLOGREQUESTS+' req stop ajax');
// 						clearTimeout(t);
// 					}
// 					// console.log(cnt);
// 					// console.log(res.text);
// 					if(res.text!==lastres){
// 						otf = document.createElement('pre');
// 						otf.innerHTML=res.text;
// 						consoleOutput.appendChild(otf);
// 						consoleOutput.scrollTop=consoleOutput.scrollHeight;
// 					}

// 					if(res.text.match('====##CONFIGURED##====')){
// 						window.ribbonNotification.showRibbon( 'installed, refresh window to get started' ,false,'success');
// 						window.silkscreenModal.showSilkscreen('Install Complete','Lets get <a href="'+window.location.href+'">started</a>. ','default');
// 						clearTimeout(t);
// 					}
// 					else if(res.text.match('====!!ERROR!!====') || res.text.match('====##REMOVED-END##====')){
// 						// console.error('there was an error in installing periodic');
// 						var errortext = res.error.message || '';
// 						window.silkscreenModal.showSilkscreen('Install error','there was an error in installing periodic. '+errortext,14,'error');
// 						window.ribbonNotification.showRibbon(' there was an error in installing periodic' ,4000,'warn');
// 						clearTimeout(t);
// 					}
// 					lastres=res.text;
// 					cnt++;
// 				}
// 			});
// 	};
// };



// window.addEventListener('load',function(){
// 	window.silkscreenModal = new silkscreen();
// 	window.ribbonNotification = new ribbon({type:'info',idSelector:'#_pea_ribbon-element'});
// 	installadmin = document.getElementById('install-admin-select');
// 	installform = document.getElementById('install_form');
// 	consoleOutput = document.getElementById('install-console-output');
// 	ajaxform.preventEnterSubmitListeners();
// 	ajaxform.ajaxFormEventListers('._pea-ajaxforms',window.ribbonNotification);
// 	installadmin.addEventListener('change',showadminoptions,false);
// 	installform.addEventListener('click',installformclick,false);
// });

// window.successFormPost = function(/*resdata*/){
// 	// console.log('resdata',resdata);
// 	document.getElementById('install-console').style.display='block';
// 	getConsoleOutput();
// 	window.ribbonNotification.showRibbon( 'beginning installation' ,4000,'info');
// };
