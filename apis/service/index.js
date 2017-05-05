var express = require('express');
var serviceRouter = express.Router();

serviceRouter.use('/layout',require('./layout'));
serviceRouter.use('/sobject',require('./sobject'));
serviceRouter.use('/sobjectlookup',require('./sobjectlookup'));
serviceRouter.use('/component',require('./component'));
serviceRouter.use('/profile',require('./profile'));
serviceRouter.use('/dashboard',require('./dashboard'));
serviceRouter.use('/archived',require('./archival'));
module.exports = serviceRouter;