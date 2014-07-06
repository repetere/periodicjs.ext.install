// var path = require('path'),
// 	passport = require('passport');

module.exports = function(periodic){
	// express,app,logger,config,db,mongoose
	var installRouter = periodic.express.Router(),
			installController = require('./controller/install')(periodic);

	installRouter.get('/', installController.index);
	installRouter.get('/install', installController.index);

	periodic.app.use(installRouter);
};