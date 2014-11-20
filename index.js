'use strict';

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
	var installRouter = periodic.express.Router(),
		installController = require('./controller/install')(periodic);

	installRouter.get('*', global.CoreCache.disableCache);
	installRouter.get('/', installController.index);
	installRouter.get('/install', installController.index);
	installRouter.get('/install/getlog', installController.get_outputlog);
	installRouter.post('/install/updateconfig', installController.update);
	installRouter.get('/*', installController.index);

	periodic.app.use(installRouter);
};
