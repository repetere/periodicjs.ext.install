'use strict';
var appenvironment,
	extend = require('utils-merge'),
	path = require('path'),
	Extensions = require('periodicjs.core.extensions'),
	CoreExtension = new Extensions({
		extensionFilePath: path.resolve(process.cwd(), './content/config/extensions.json')
	}),
	fs = require('fs-extra'),
	loginExtSettingsFile = path.resolve(CoreExtension.getconfigdir({
		extname: 'periodicjs.ext.login'
	}), './settings.json'),
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
			length_of_username: 2,
			length_of_password: 8,
			send_new_user_email: true
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
	periodic.app.controller.extension.install = {
		install: require('./controller/install')(periodic)
	};
	var installRouter = periodic.express.Router(),
		installController = periodic.app.controller.extension.install.install;

	installRouter.get('*', global.CoreCache.disableCache);
	installRouter.get('/', installController.index);
	installRouter.get('/install', installController.index);
	installRouter.get('/install/getlog', installController.get_outputlog);
	installRouter.post('/install/updateconfig', installController.update);
	installRouter.get('/*', installController.index);

	periodic.app.use(installRouter);
	return periodic;
};
