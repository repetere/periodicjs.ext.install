'use strict';

var path = require('path'),
		appController = require(path.join(process.cwd(),'app/controller/application')),
		applicationController,
		appSettings,
		logger;

var rand = function() {
    return Math.random().toString(36).substr(2); // remove `0.`
};

var token = function() {
    return rand() + rand(); // to make it longer
};

var index = function(req, res, next) {
	applicationController.getPluginViewTemplate({
		res:res,
		req:req,
		viewname:'install/index',
		pluginname:'periodicjs.ext.install',
		themepath:appSettings.themepath,
		themefileext:appSettings.templatefileextension,
		callback:function(templatepath){
			applicationController.handleDocumentQueryRender({
				res:res,
				req:req,
				renderView:templatepath,
				responseData:{
					pagedata:{
						title:'Welcome to Periodicjs',
						cookieparser:token(),
						temppassword:token().substr(0,8)
					},
					periodic:{
						version: appSettings.version
					},
					user:req.user
				}
			});
		}
	});
};

var controller = function(resources){
	logger = resources.logger;
	appSettings = resources.settings;
	applicationController = new appController(resources);

	return{
		index:index
	};
};

module.exports = controller;