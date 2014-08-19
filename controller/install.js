'use strict';

var path = require('path'),
		async = require('async'),
		fs = require('fs-extra'),
		mongoose = require('mongoose'),
		logdir = path.resolve(process.cwd(),'logs/'),
		logfile = path.join(logdir,'install-periodicjs.log'),
    Utilities = require('periodicjs.core.utilities'),
    ControllerHelper = require('periodicjs.core.controllerhelper'),
    CoreUtilities,
    CoreController,
    appSettings,
		logger,
		restartfile = path.join(process.cwd(), '/content/extensions/restart.json');

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

var update_outputlog = function(options){
	var logdata = options.logdata+'\r\n',
			callback = options.callback;

	fs.appendFile(logfile,logdata,function(err){
		if(err){
			logger.error(err);
			callback(err);
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

var get_outputlog = function(req,res){
	var stat = fs.statSync(logfile),
			readStream = fs.createReadStream(logfile);

	res.writeHead(200, {
		'Content-Type': ' text/plain',
		'Content-Length': stat.size
	});
	readStream.pipe(res);
};

var configurePeriodic = function(req,res,next,options){
	var updatesettings = options.updatesettings,
			userdata = options.userdata,
			userSchema = require(path.resolve(process.cwd(),'app/model/user.js')),
			User = mongoose.model('User',userSchema);

	var writeConfJson = function(callback){
		var confJsonFilePath = path.resolve(process.cwd(),'content/config/config.json'),
				confJson={
					'application':{
						'port': '8786',
						'environment': 'development'
					},
					'cookies':{
						'cookieParser':updatesettings.cookieparser
					},
				  'theme': 'periodicjs.theme.default',
				  'status':'active'
				};
		if(updatesettings.appname){
			confJson.name = updatesettings.appname;
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

		fs.outputJson(confJsonFilePath,confJson,function(err,data){
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

	var updateExtensionConf = function(callback){
		var updateConfSettings = {},
				currentExtensionsConf,
				extfilepath=path.join(process.cwd(),'/content/extensions/extensions.json'),
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
		//create user data
		function(callback){
			if(updatesettings.admin==='true'){
				update_outputlog({
					logdata : 'creating admin user'
				});
				User.fastRegisterUser(userdata,function(err,userdata){
					if(err){
						callback(err,null);
						mongoose.connection.close();
					}
					else{
						callback(null,userdata);
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
	function(err,results){
		if(err){
			errorlog_outputlog({
				logdata : err.message,
				cli : options.cli
			});
		}
		else{
			logger.silly(results);
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
			d = new Date();//,
			// badusername = new RegExp(/\bremove\b|\bconfig\b|\bprofile\b|\bindex\b|\bcreate\b|\bdelete\b|\bdestroy\b|\bedit\b|\btrue\b|\bfalse\b|\bupdate\b|\blogin\b|\blogut\b|\bdestroy\b|\bwelcome\b|\bdashboard\b/i);

	// if (updatesettings.admin==='true' && (userdata.username === undefined || badusername.test(userdata.username))) {
	// 	applicationController.handleDocumentQueryErrorResponse({
	// 		err:new Error('Invalid username'),
	// 		res:res,
	// 		req:req
	// 	});
	// }
	// else 
	if (updatesettings.admin==='true' && (userdata.username === undefined || userdata.username.length < 4)) {
		CoreController.handleDocumentQueryErrorResponse({
			err:new Error('Username is too short'),
			res:res,
			req:req
		});
	}
	else if (updatesettings.admin==='true' && (userdata.email===undefined || userdata.email.match(/^([^@\s]+)@((?:[-a-z0-9]+\.)+[a-z]{2,})$/i) === null)) {
		CoreController.handleDocumentQueryErrorResponse({
			err:new Error('Invalid email'),
			res:res,
			req:req
		});
	}
	else if (updatesettings.admin==='true' && (userdata.password === undefined || userdata.password.length < 8)) {
		CoreController.handleDocumentQueryErrorResponse({
			err:new Error('Password is too short'),
			res:res,
			req:req
		});
	}
	else if (updatesettings.admin==='true' && (userdata.password !== userdata.passwordconfirm)) {
		CoreController.handleDocumentQueryErrorResponse({
			err:new Error('Passwords do not match'),
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

var index = function(req, res) {
	var rand = function() {
	    return Math.random().toString(36).substr(2); // remove `0.`
	};

	var token = function() {
	    return rand() + rand(); // to make it longer
	};

	CoreController.getPluginViewTemplate({
		res:res,
		req:req,
		viewname:'install/index',
		pluginname:'periodicjs.ext.install',
		themepath:appSettings.themepath,
		themefileext:appSettings.templatefileextension,
		callback:function(templatepath){
			CoreController.handleDocumentQueryRender({
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
  CoreController = new ControllerHelper(resources);
  CoreUtilities = new Utilities(resources);

	return{
		index:index,
		update:update,
		get_outputlog:get_outputlog
	};
};

module.exports = controller;