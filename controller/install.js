'use strict';

var path = require('path'),
		async = require('async'),
		extend = require('utils-merge'),
		fs = require('fs-extra'),
		mongoose = require('mongoose'),
		logdir = path.resolve(process.cwd(),'logs/'),
		logfile = path.join(logdir,'install-periodicjs.log'),
    Utilities = require('periodicjs.core.utilities'),
    ControllerHelper = require('periodicjs.core.controller'),
	  CoreMailer = require('periodicjs.core.mailer'),
    CoreUtilities,
    CoreController,
    loginExtSettings,
    appSettings,
		logger,
		databaseurl,
		appenvironment,
		User,
		userSchema,
		restartfile = path.join(process.cwd(), '/content/config/restart.json');


/**
 * output install process error to log file, the ==!!ERROR!!== triggers client to stop querying for updates
 * @param  {object} options logdata,cli
 */
var errorlog_outputlog = function(options){
	var logdata = options.logdata+'\r\n ';
	logger.error(logdata);
	fs.appendFile(logfile,logdata+'====!!ERROR!!====',function(err){
		if(err){
			logger.error(err);
		}
		if(options.cli){
			process.exit(0);
		}
	});
};

/**
 * output install process output to log file
 * @param  {object} options logdata,cli,callback - async callback
 * @return {Function} callback(err)
 */
var update_outputlog = function(options){
	var logdata = options.logdata+'\r\n',
			callback = options.callback;

	fs.appendFile(logfile,logdata,function(err){
		if(err){
			logger.error(err);
			if(callback){
				callback(err);
			}
			//try and write message to end console
			errorlog_outputlog({
				logfile : logfile,
				logdata : err.message
			});
		}
		else{
			if(callback){
				callback(null);
			}
		}
	});
};

/**
 * streams error logfile output to client
 * @param  {object} req 
 * @param  {object} res 
 * @return {object} reponds with an error page or requested view
 */
var get_outputlog = function(req,res){
	var stat = fs.statSync(logfile),
			readStream = fs.createReadStream(logfile);

	res.writeHead(200, {
		'Content-Type': ' text/plain',
		'Content-Length': stat.size
	});
	readStream.pipe(res);
};

/**
 * writes a conf.json file, creates an admin user, seeds database, restarts application 
 * @param  {object} req 
 * @param  {object} res 
 * @param {object} next 
 * @param {object} options userdata & update settings - submission data from form
 * @return {object} reponds with an error page or requested view
 */
var configurePeriodic = function(req,res,next,options){
	var updatesettings = options.updatesettings,
			userdata = options.userdata;

	/**
	 * async write a conf.json file
	 * @param  {Function} callback asynchronous callback
	 * @return {Function}            callback(err,status)
	 */
	var writeConfJson = function(callback){
		var confJsonFilePath = path.resolve(process.cwd(),'content/config/config.json'),
			confport = (appSettings.application.port) ? appSettings.application.port : '8786' ,
			confenv = (appSettings.application.environment) ? appSettings.application.environment : 'development' ,
			confJson={
					'application':{
						'port': confport,
						'environment': confenv
					},
					'cookies':{
						'cookieParser':updatesettings.cookieparser
					},
				  'theme': 'periodicjs.theme.reader',
					'session_secret':updatesettings.session_secret,
				  'status':'active'
				},
			envconfJsonFilePath = path.resolve(process.cwd(),'content/config/environment/'+confenv+'.json'),
			envconfJson = {},
			globalconfJson ={};
		if(updatesettings.appname){
			confJson.name = updatesettings.appname;
		}
		if(updatesettings.admin){
			confJson.adminnotificationemail = userdata.email;
			confJson.homepage = req.headers.host;
		}
		if(updatesettings.themename){
			confJson.theme = updatesettings.themename;
		}
		switch(updatesettings.sessions){
			case 'mongo':
				confJson.sessions = {
					'enabled':true,
					'type':'mongo'
				};
				confJson.crsf = true;
				break;
			case 'cookie':
				confJson.sessions = {
					'enabled':true,
					'type':'cookie'
				};
				confJson.crsf = true;
				break;
			default:
				confJson.sessions = {
					'enabled':false,
					'type':'default'
				};
				confJson.crsf = false;
				break;
		}

		globalconfJson.sessions = confJson.sessions;
		globalconfJson.status = confJson.status;
		globalconfJson.session_secret = confJson.session_secret;
		globalconfJson.cookies = confJson.cookies;
		envconfJson = confJson;

		async.parallel([
				function(asyncCB){
					fs.outputJson(confJsonFilePath,globalconfJson,asyncCB);
				},
				function(asyncCB){
					fs.outputJson(envconfJsonFilePath,envconfJson,asyncCB);
				}
			],
			function(err,data){
				if(err){
					callback(err,null);
				}
				else{
					update_outputlog({
						logdata : 'installed, config.conf updated \r\n  ====##CONFIGURED##====',
						callback : function(err){
							if(err){
								callback(err,null);
							}
							else{
								callback(null,'updated conf',data);
							}
						}
					});
				}
		});
	};

/**
 * updates the order of extensions during install process
 * @param  {Function} callback async callback
 * @return {Function}            callback(err,status)
 */
	var updateExtensionConf = function(callback){
		var updateConfSettings = {},
				currentExtensionsConf,
				extfilepath=path.join(process.cwd(),'/content/config/extensions.json'),
				ext_install=false,
				ext_mailer=false,
				ext_login=false,
				ext_dbseed=false,
				ext_defaultroutes=false,
				ext_scheduledcontent=false,
				ext_useraccescontrol=false,
				ext_admin=false;
		updateConfSettings.extensions = [];

		if(updatesettings.admin==='true'){
			fs.readJson(extfilepath,function(err,extConfJSON){
				if(err){
					callback(err,null);
				}
				else{
					currentExtensionsConf = extConfJSON;
					for(var x in currentExtensionsConf.extensions){
						if(currentExtensionsConf.extensions[x].name === 'periodicjs.ext.install'){
							ext_install=currentExtensionsConf.extensions[x];
							ext_install.enabled=false;
						}
						if(currentExtensionsConf.extensions[x].name === 'periodicjs.ext.default_routes'){
							ext_defaultroutes=currentExtensionsConf.extensions[x];
							ext_defaultroutes.enabled=true;
						}
						if(currentExtensionsConf.extensions[x].name === 'periodicjs.ext.mailer'){
							ext_mailer=currentExtensionsConf.extensions[x];
							ext_mailer.enabled=true;
						}
						if(currentExtensionsConf.extensions[x].name === 'periodicjs.ext.login'){
							ext_login=currentExtensionsConf.extensions[x];
							ext_login.enabled=true;
						}
						if(currentExtensionsConf.extensions[x].name === 'periodicjs.ext.admin'){
							ext_admin=currentExtensionsConf.extensions[x];
							ext_admin.enabled=true;
						}
						if(currentExtensionsConf.extensions[x].name === 'periodicjs.ext.scheduled_content'){
							ext_scheduledcontent=currentExtensionsConf.extensions[x];
							ext_scheduledcontent.enabled=true;
						}
						if(currentExtensionsConf.extensions[x].name === 'periodicjs.ext.user_access_control'){
							ext_useraccescontrol=currentExtensionsConf.extensions[x];
							ext_useraccescontrol.enabled=true;
						}
						if(currentExtensionsConf.extensions[x].name === 'periodicjs.ext.dbseed'){
							ext_dbseed=currentExtensionsConf.extensions[x];
							ext_dbseed.enabled=true;
						}
					}
					//check installs
					if(!ext_install){
						callback(new Error('Invalid extension installation: periodicjs.ext.install'),null);
					}
					if(!ext_defaultroutes){
						callback(new Error('Invalid extension installation: periodicjs.ext.defaultroutes'),null);
					}
					if(!ext_mailer){
						console.log('ext_mailer',ext_mailer);
						callback(new Error('Invalid extension installation: periodicjs.ext.mailer'),null);
					}
					if(!ext_login){
						console.log('ext_login',ext_login);
						callback(new Error('Invalid extension installation: periodicjs.ext.login'),null);
					}
					if(!ext_admin){
						callback(new Error('Invalid extension installation: periodicjs.ext.admin'),null);
					}
					if(!ext_dbseed){
						callback(new Error('Invalid extension installation: periodicjs.ext.dbseed'),null);
					}
					if(!ext_scheduledcontent){
						callback(new Error('Invalid extension installation: periodicjs.ext.scheduled_content'),null);
					}
					if(!ext_useraccescontrol){
						callback(new Error('Invalid extension installation: periodicjs.ext.user_access_control'),null);
					}

					if(ext_install && ext_defaultroutes && ext_mailer && ext_login && ext_useraccescontrol && ext_scheduledcontent && ext_admin && ext_dbseed){
						updateConfSettings.extensions = [ext_install,ext_defaultroutes,ext_mailer,ext_login,ext_useraccescontrol,ext_scheduledcontent,ext_admin,ext_dbseed];
						fs.outputJson(extfilepath,updateConfSettings,function(err){
							if(err){
								callback(err,null);
							}
							else{
								update_outputlog({
									logdata : 'updated conf settings'
								});
								callback(null,'updated conf settings');
							}
						});
					}
					else{
						callback(new Error('Invalid extension installation: could not update extensions and install'),null);
					}
				}
			});
		}
		else{
			fs.readJson(extfilepath,function(err,extConfJSON){
				if(err){
					callback(err,null);
				}
				else{
					currentExtensionsConf = extConfJSON;
					for(var x in currentExtensionsConf.extensions){
						if(currentExtensionsConf.extensions[x].name === 'periodicjs.ext.install'){
							ext_install=currentExtensionsConf.extensions[x];
							currentExtensionsConf.extensions[x].enabled=false;
						}
					}
					//check installs
					if(!ext_install){
						callback(new Error('Invalid extension installation: periodicjs.ext.install'),null);
					}
					if(ext_install){
						updateConfSettings = currentExtensionsConf;
						fs.outputJson(extfilepath,updateConfSettings,function(err){
							if(err){
								callback(err,null);
							}
							else{
								update_outputlog({
									logdata : 'updated conf settings'
								});
								callback(null,'updated conf settings');
							}
						});
					}
					else{
						callback(new Error('Invalid extension installation: could not update extensions to disable install extension'),null);
					}
				}
			});
		}
	};

	async.series([
		//write database json
		/*
		function(callback){
			var dbjson='',
					dbjsfile=path.join(process.cwd(),'/content/config/database.js');
			dbjson+='"use strict";\r\n';
			dbjson+='\r\n';
			dbjson+='var mongoose = require("mongoose");\r\n';
			dbjson+='\r\n';
			dbjson+='module.exports = {\r\n';
			dbjson+='	"development":{\r\n';
			dbjson+='		url: "'+updatesettings.mongoconnectionurl+'",\r\n';
			dbjson+='		mongoose: mongoose,\r\n';
			dbjson+='		mongooptions:{}\r\n';
			dbjson+='	},\r\n';
			dbjson+='	"production":{\r\n';
			dbjson+='		url: "'+updatesettings.mongoconnectionurl+'",\r\n';
			dbjson+='		mongoose: mongoose,\r\n';
			dbjson+='		mongooptions:{}\r\n';
			dbjson+='	}\r\n';
			dbjson+='};\r\n';

			// logger.silly('restartfile',restartfile);
			fs.outputFile(dbjsfile,dbjson,function(err){
				if(err){
					callback(err,null);
				}
				else{
					callback(null,'updated database.json');
				}
			});
		},
		*/
		//create user data
		function(callback){
			if(updatesettings.admin==='true'){
				update_outputlog({
					logdata : 'creating admin user'
				});
				
				var newuseroptions = {
					newuser: userdata,
					lognewuserin: false,
					req: req,
					send_new_user_email: loginExtSettings.new_user_validation.send_new_user_email,
					welcomeemaildata: {
						getEmailTemplateFunction: CoreController.getPluginViewDefaultTemplate,
						emailviewname: 'email/user/welcome',
						themefileext: appSettings.templatefileextension,
						sendEmailFunction: CoreMailer.sendEmail,
						subject: appSettings.name + ' New User Registration',
						replyto: appSettings.adminnotificationemail,
						hostname: req.headers.host,
						appenvironment: appenvironment,
						appname: appSettings.name,
					}
				};
				User.createNewUserAccount(
					newuseroptions,
					function (newusererr, newuser ) {
						if(newusererr){
							callback(newusererr,null);
							// mongoose.connection.close();
						}
						else{
							callback(null,newuser);
						}
					});
			}
			else{
				callback(null,'skipping admin user set up');
			}
		},
		function(callback){
			updateExtensionConf(callback);
		},
		function(callback){
			if(updatesettings.admin==='true'){
				update_outputlog({
					logdata : 'seeding database'
				});
				CoreUtilities.async_run_cmd(
					'node',
					['index.js','--cli','--extension','dbseed','--task','sampledata'],
					function(consoleoutput){
						update_outputlog({
							logdata : consoleoutput
						});
					},
					function(err,data){
						if(err){
							callback(err,null);
						}
						else{
							callback(null,data);
						}
					}
				);
			}
			else{
				callback(null,'skipping seeding database');
			}
			// node index.js --cli --extension seed --task sampledata
		},
		function(callback){
			writeConfJson(callback);
		}
	],
	//final result
	function(err
		//,results
		){
		if(err){
			errorlog_outputlog({
				logdata : err.message,
				cli : options.cli
			});
		}
		else{
			// logger.silly(results);
			if(options.cli){
				logger.info('installed, config.conf updated \r\n  ====##CONFIGURED##====');
				process.exit(0);
			}
			else{
				CoreUtilities.restart_app({
					restartfile: restartfile
				});
			}
		}
	});
};

/**
 * test to make sure mongoose is connecting successfully
 * @param  {object} req 
 * @param  {object} res 
 * @param  {object} next 
 * @param  {object} options 
 * @param  {object} res 
 * @return {@function} async callback(req,res,err,options)
 */
var testmongoconfig = function(req,res,next,options){
	var updatesettings = options.updatesettings;
	if(mongoose.Connection.STATES.connected !== mongoose.connection.readyState){
		mongoose.connect(updatesettings.mongoconnectionurl, function(err) {
			if (err){
				errorlog_outputlog({
					logdata : err.message,
					cli : options.cli
				});
			}
			else{
				configurePeriodic(req,res,next,options);
			}
		});
	}
	else{
		configurePeriodic(req,res,next,options);
	}
};

/**
 * handles install script http post and checks input for valid credentials for creating an admin user
 * @param  {object} req 
 * @param  {object} res 
 * @return {object} reponds with an error page or requested view
 */
var update = function(req, res, next){
	var updatesettings = CoreUtilities.removeEmptyObjectValues(req.body),
			userdata = {
				username: updatesettings.username,
				email: updatesettings.email,
				accounttype: 'admin',
				activated: true,
				password: updatesettings.password,
				passwordconfirm: updatesettings.passwordconfirm
			},
			d = new Date(),
			userValidationError = User.checkValidation(extend({newuser:userdata}, loginExtSettings.new_user_validation));
		updatesettings.mongoconnectionurl = databaseurl;

	if(updatesettings.admin === 'true' && userValidationError){
		CoreController.handleDocumentQueryErrorResponse({
			err:userValidationError,
			res:res,
			req:req
		});
	}
	else {
		fs.outputFile(logfile,'configuration log '+d+'- \r\n ');

		update_outputlog({
			logdata : 'beginning configuration install: ',
			callback : function(err) {
				if(err) {
					CoreController.handleDocumentQueryErrorResponse({
						err:err,
						res:res,
						req:req
					});
				}
				else {
					CoreController.handleDocumentQueryRender({
						res:res,
						req:req,
						responseData:{
							result:'success',
							data:{
								message:'allgood'
							}
						}
					});
					testmongoconfig(req,res,next,{
						updatesettings:updatesettings,
						userdata:userdata
					});
				}
			}
		});
	}
};

/**
 * displays the install script landing page
 * @param  {object} req 
 * @param  {object} res 
 */
var index = function(req, res) {
	// console.log('mongoose.connection',mongoose.connection);
	var rand = function() {
	    return Math.random().toString(36).substr(2); // remove `0.`
	};

	var token = function() {
	    return rand() + rand(); // to make it longer
	};

	CoreController.getPluginViewDefaultTemplate(
      {
          viewname:'install/index',
          themefileext:appSettings.templatefileextension,
          extname: 'periodicjs.ext.install'
      },
      function(err,templatepath){
          CoreController.handleDocumentQueryRender({
              res:res,
              req:req,
              renderView:templatepath,
              responseData:{
                pagedata:{
									title:'Welcome to Periodicjs',
									cookieparser:token(),
									databaseurl:databaseurl,
									session_secret: token(),
									appenvironment: appenvironment,
									appname: appSettings.name,
									temppassword:token().substr(0,8)
								},
								periodic:{
									version: appSettings.version
								},
								user:req.user
              }
          });
      }
  );
};

/**
 * install controller
 * @module installController
 * @{@link https://github.com/typesettin/periodicjs.ext.install}
 * @author Yaw Joseph Etse
 * @copyright Copyright (c) 2014 Typesettin. All rights reserved.
 * @license MIT
 * @requires module:async
 * @requires module:path
 * @requires module:mongoose
 * @requires module:fs-extra
 * @requires module:periodicjs.core.utilities
 * @requires module:periodicjs.core.controller
 * @requires module:periodicjs.core.extensions
 * @param  {object} resources variable injection from current periodic instance with references to the active logger and mongo session
 * @return {object}           sendmail
 */
var controller = function(resources){
	databaseurl = resources.db.url;
	logger = resources.logger;
	appSettings = resources.settings;
	userSchema = require(path.resolve(process.cwd(),'app/model/user.js'));
	User = mongoose.model('User',userSchema);
  CoreController = new ControllerHelper(resources);
  CoreUtilities = new Utilities(resources);
	appenvironment = appSettings.application.environment;
	loginExtSettings = resources.app.controller.extension.install.loginExtSettings;

	return{
		index:index,
		update:update,
		get_outputlog:get_outputlog
	};
};

module.exports = controller;