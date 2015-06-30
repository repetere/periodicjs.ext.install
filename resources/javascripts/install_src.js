'use strict';

var StylieNotification = require('stylie.notifications'),
	StylieModals = require('stylie.modals'),
	PeriodicModal,
	// installadmin,
	// installform,
	// consoleOutput,
	open_modal_buttons;

console.log('stylie install');

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

var elementSelectors = function () {
	open_modal_buttons = document.querySelectorAll('.ts-toottip.pop-tooltip');
};

var elementEventListeners = function () {
	for (var q = 0; q < open_modal_buttons.length; q++) {
		open_modal_buttons[q].addEventListener('click', openModalButtonListener, false);
	}
};

var init = function () {
	elementSelectors();
	elementEventListeners();
	PeriodicModal = new StylieModals({});
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
