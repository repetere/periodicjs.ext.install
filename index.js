'use strict';
var appenvironment,
	extend = require('utils-merge'),
	path = require('path'),
	fs = require('fs-extra'),
	loginExtSettingsFile = path.join(process.cwd(), 'content/config/extensions/periodicjs.ext.login/settings.json'),
	loginSettingJSON,
	default_new_user_settings = {
		settings: {
			usepassword: true,
			requireusername: true,
			requireemail: true,
			disablesocialsignin: true
		},
		new_user_validation: {
			checkusername: true,
			checkpassword: true,
			length_of_username: 1,
			length_of_password: 8,
			send_new_user_email: true
		},
		complexitySettings: {
			useComplexity: true,
			settings: {
				weak: {
					uppercase: 1,
					lowercase: 1,
					min: 8
				},
				medium: {
					uppercase: 1,
					lowercase: 1,
					digit: 1,
					min: 8
				},
				strong: {
					uppercase: 1,
					lowercase: 1,
					digit: 1,
					special: 1,
					min: 8
				}
			}
		}
	},
	settingJSON;
/**
 * The install extension, configures an instance of perioidic through a web interface.
 * @{@link https://github.com/typesettin/periodicjs.ext.install}
 * @author Yaw Joseph Etse
 * @copyright Copyright (c) 2014 Typesettin. All rights reserved.
 * @license MIT
 * @exports periodicjs.ext.install
 * @requires module:passport
 * @param  {object} periodic variable injection of resources from current periodic instance
 */
module.exports = function (periodic) {
	// express,app,logger,config,db,mongoose
	appenvironment = periodic.settings.application.environment;
	try {
		settingJSON = fs.readJsonSync(loginExtSettingsFile);
	}
	catch (e) {
		settingJSON = {};
	}
	loginSettingJSON = (settingJSON[appenvironment]) ? extend(default_new_user_settings, settingJSON[appenvironment]) : default_new_user_settings;
	periodic.app.controller.extension.install = {
		loginExtSettings: loginSettingJSON
	};
	if(!periodic.core){
		var 
	Utilities = require('periodicjs.core.utilities'),
	Controllers = require('periodicjs.core.controller');
		require(path.join(__dirname,'../../content/config/model'))({
			mongoose: periodic.db.mongoose,
			dburl: periodic.db.url,
			dboptions: periodic.db.mongooptions,
			debug: periodic.settings.debug,
			periodic: periodic
		});
		periodic.core = {
			controller: new Controllers(periodic),
			utilities: new Utilities(periodic)
		};
	}
	periodic.app.controller.extension.install = {
		install: require('./controller/install')(periodic)
	};
	var installRouter = periodic.express.Router(),
		installController = periodic.app.controller.extension.install.install,
		homeController = require(path.join(process.cwd(), 'app/controller/home'))(periodic);

	installRouter.get('*', global.CoreCache.disableCache);
	installRouter.get('/', installController.index);
	installRouter.get('/install', installController.index);
	// installRouter.get('/install/getlog', installController.get_outputlog);
	installRouter.post('/install/updateconfig', installController.checkUserValidation, installController.update);
	installRouter.get('/*', installController.index);
	installRouter.use('*', homeController.catch404);

	periodic.app.use(installRouter);
	return periodic;
};
