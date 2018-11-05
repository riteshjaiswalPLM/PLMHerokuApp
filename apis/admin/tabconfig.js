var express = require('express');
var tabConfigRouter = express.Router();

tabConfigRouter.post('/fetchConfig', function (req, res) {
    var tabConfigs = db.TabConfig.findAll({
        attributes: {
            exclude: ['createdAt', 'updatedAt']
        }
    });
    tabConfigs.then(function (tabConfig) {
        if (tabConfig === undefined || tabConfig === null || tabConfig.length == 0) {
            db.TabConfig.create({
                reportTab: false,
                archivalTab: false,
                bulkUploadTab: false
            }).then(function (newTabConfig) {
                return res.json({
                    success: true,
                    data: {
                        tabConfig: newTabConfig
                    }
                });
            }).catch(function (err) {
                return res.json({
                    success: false,
                    message: 'Error occured while loading Tab config.',
                    error: err
                });
            });
        } else {
            return res.json({
                success: true,
                data: {
                    tabConfig: tabConfig[0]
                }
            });
        }
    });
});

tabConfigRouter.post('/save', function (req, res) {
    db.TabConfig.update(req.body,
        {
            where: {}
        }).then(function () {
            return res.json({
                success: true
            });
        }).catch(function (err) {
            return res.json({
                success: false,
                message: 'Error occured while saving Tab config.',
                error: err
            });
        });
});

module.exports = tabConfigRouter;