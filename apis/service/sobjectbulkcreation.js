var express = require('express');
var sobjectRouter1 = express.Router();

sobjectRouter1.post('/save', function (req, res) {
	var queryObject = req.body;

	var primaryFileName, secondaryFileList, creationObjectIds = [];
	console.log("sobjectbulkcreation.js -> queryObject : " + queryObject);
	for (var i = 0; i < queryObject.length; i++) {
		console.log("sobjectbulkcreation.js -> queryObject.InvoiceFile : " + queryObject.InvoiceFile);
	}

	global.sfdc.sobject('Invoice__c')
		.create(queryObject.InvoiceFile, function (err, result) {
			if (err) {
				return res.json({
					success: false,
					message: 'Error occured while inserting record.',
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

module.exports = sobjectRouter1;