#Index

**Modules**

* [periodicjs.ext.install](#periodicjs.ext.module_install)
* [installController](#module_installController)

**Functions**

* [errorlog_outputlog(options)](#errorlog_outputlog)
* [update_outputlog(options)](#update_outputlog)
* [get_outputlog(req, res)](#get_outputlog)
* [configurePeriodic(req, res, next, options)](#configurePeriodic)
  * [configurePeriodic~writeConfJson(callback)](#configurePeriodic..writeConfJson)
  * [configurePeriodic~updateExtensionConf(callback)](#configurePeriodic..updateExtensionConf)
* [testmongoconfig(req, res, next, options, res)](#testmongoconfig)
* [update(req, res)](#update)
* [index(req, res)](#index)
 
<a name="periodicjs.ext.module_install"></a>
#periodicjs.ext.install
The install extension, configures an instance of perioidic through a web interface.

**Params**

- periodic `object` - variable injection of resources from current periodic instance  

**Author**: Yaw Joseph Etse  
**License**: MIT  
**Copyright**: Copyright (c) 2014 Typesettin. All rights reserved.  
<a name="module_installController"></a>
#installController
install controller

**Params**

- resources `object` - variable injection from current periodic instance with references to the active logger and mongo session  

**Returns**: `object` - sendmail  
**Author**: Yaw Joseph Etse  
**License**: MIT  
**Copyright**: Copyright (c) 2014 Typesettin. All rights reserved.  
<a name="errorlog_outputlog"></a>
#errorlog_outputlog(options)
output install process error to log file, the ==!!ERROR!!== triggers client to stop querying for updates

**Params**

- options `object` - logdata,cli  

<a name="update_outputlog"></a>
#update_outputlog(options)
output install process output to log file

**Params**

- options `object` - logdata,cli,callback - async callback  

**Returns**: `function` - callback(err)  
<a name="get_outputlog"></a>
#get_outputlog(req, res)
streams error logfile output to client

**Params**

- req `object`  
- res `object`  

**Returns**: `object` - reponds with an error page or requested view  
<a name="configurePeriodic"></a>
#configurePeriodic(req, res, next, options)
writes a conf.json file, creates an admin user, seeds database, restarts application

**Params**

- req `object`  
- res `object`  
- next `object`  
- options `object` - userdata & update settings - submission data from form  

**Returns**: `object` - reponds with an error page or requested view  
<a name="testmongoconfig"></a>
#testmongoconfig(req, res, next, options, res)
test to make sure mongoose is connecting successfully

**Params**

- req `object`  
- res `object`  
- next `object`  
- options `object`  
- res `object`  

**Returns**:  - {@function} async callback(req,res,err,options)  
<a name="update"></a>
#update(req, res)
handles install script http post and checks input for valid credentials for creating an admin user

**Params**

- req `object`  
- res `object`  

**Returns**: `object` - reponds with an error page or requested view  
<a name="index"></a>
#index(req, res)
displays the install script landing page

**Params**

- req `object`  
- res `object`  

