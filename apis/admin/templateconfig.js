var express = require('express');
var templateConfRouter = express.Router();

templateConfRouter.post('/list', function (req, res) {
    var Template = db.Template.findAll({
        include: [{
            model: db.Language,
            attributes: {
                exclude: ['createdAt', 'updatedAt']
            }
        }],
        attributes: {
            exclude: ['createdAt', 'updatedAt']
        }
    });

    Template.then(function (sTemplates) {
        console.log("Template::", sTemplates);
        if (sTemplates === undefined || sTemplates === null) {
            return res.json({
                success: false,
                message: 'template utilityname not exist.',
                data: {
                    utilityName: ['reset-password'],
                    emailType: ['text', 'html']
                }
            });
        } else {
            return res.json({
                success: true,
                data: {
                    sTemplates: sTemplates,
                    utilityName: ['reset-password'],
                    emailType: ['text', 'html']
                }
            });
        }
    });
});

templateConfRouter.post('/delete', function (req, res) {
    var Template = req.body;
    db.Template.destroy({
        where: {
            id: Template.id
        }
    }).then(function () {
        return res.json({
            success: true
        });
    });
});
templateConfRouter.post('/save', function (req, res) {
    var templateToSave = req.body;
    console.log("Template:::", templateToSave);
    if (templateToSave === null || templateToSave === undefined) {
        return res.json({
            success: false,
            message: 'No data found for Template.'
        });
    } else if (templateToSave.id === undefined || templateToSave.id === null) {
        //IF NOT EXIST CREATE TEMPLATE
        db.Template.findOrCreate({
            where: {
                utilityname: templateToSave.utilityname,
                LanguageId: templateToSave.Language.id
            },
            defaults: {
                utilityname: templateToSave.utilityname,
                subject: templateToSave.subject,
                body: templateToSave.body,
                emailtype: templateToSave.emailtype,
                active: templateToSave.active,
                LanguageId: templateToSave.Language.id
            }

        }).spread(function (Template, created) {
            console.log("Template::", Template);
            if (!created) {
                return res.json({
                    success: false,
                    message: 'Duplicate record found'
                });
            }
            else {
                return res.json({
                    success: true,
                    data: {
                        templateToSave: templateToSave
                    }
                });
            }
        })
    }
    else {
        // UPDATE EXISTING TEMPLATE
        db.Template.update({
            subject: templateToSave.subject,
            body: templateToSave.body,
            emailtype: templateToSave.emailtype,
            active: templateToSave.active
        }, {
                where: {
                    id: templateToSave.id
                }
            }).then(function () {
                return res.json({
                    success: true,
                    data: {
                        templateToSave: templateToSave
                    }
                });
            });
    }
});
module.exports = templateConfRouter;