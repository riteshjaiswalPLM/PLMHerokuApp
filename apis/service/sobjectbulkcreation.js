var express = require('express');
var sobjectRouter1 = express.Router();
var path = require('path');
var fs = require('fs');
var dateFormat = require('dateformat');
var jsForce = require('jsforce');
var now = new Date();
var os = require('os');
var XlsxPopulate = require('xlsx-populate');
var timestamp = require('unix-timestamp');


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
					message: 'successfully inserted record.' + result.length - 1
				});
			}

		});
});

module.exports = sobjectRouter1;