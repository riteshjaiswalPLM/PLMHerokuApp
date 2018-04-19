var express = require('express');
var sobjectbulkuploadRouter = express.Router();

sobjectbulkuploadRouter.post('/save', function (req, res) {
	var queryObject = req.body;
	var primaryFileName, secondaryFileList, creationObjectIds = [];

	global.sfdc.sobject(queryObject.sObjectName)
		.create(queryObject.records, function (err, result) {
			if (err) {
				return res.json({
					success: false,
					message: 'Error occured while inserting records.',
					error: err.message
				});
			} else {
				return res.json({
					success: true,
					message: 'Records have been created successfully.'
				});
			}
		});
});

module.exports = sobjectbulkuploadRouter;