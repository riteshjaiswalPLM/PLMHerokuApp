var express = require('express');
var sobjectbulkuploadRouter = express.Router();

sobjectbulkuploadRouter.post('/save', function (req, res) {
	var queryObject = req.body;
	console.log(queryObject.records);

	var uploadRecords = function () {
		console.log("uploadRecords ====================================");
		try {
			global.sfdc.sobject(queryObject.sObjectName)
				.insertBulk(queryObject.records, function (err, result) {
					console.log("res received from SF ====================================");
					if (err) {
						console.log("err ====================================");
						console.log(err);
						console.log("err ====================================");
					} else {
						for (var i = 0; i < result.length; i++) {
							if (result[i].success) {
								console.log("#" + (i + 1) + " loaded successfully, id = " + result[i].id);
							} else {
								console.log("#" + (i + 1) + " error occurred, message = " + result[i].errors.join(', '));
							}
						}
					}
				});
		}
		catch (err1) {
			console.log('eer', err1);
		}
	};

	uploadRecords();
	return res.json({
		success: true,
		message: 'Processing...'
	});
});

module.exports = sobjectbulkuploadRouter;