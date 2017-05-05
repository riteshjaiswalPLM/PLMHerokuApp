var express = require('express');
var orgdetailRouter = express.Router();
var path = require('path');
var formidable = require('formidable');
var fs = require('fs');
var timestamp = require('unix-timestamp');
var http = require('http');
var os = require('os');
var request = require('request');
var mime = require('mime');


orgdetailRouter.post('/list', function (req, res) {
    var body = req.body;
    var MobileOrgDetail = global.db.MobileOrgDetail.findAll();
    MobileOrgDetail.then(function (orgDetail) {
        if (orgDetail === undefined || orgDetail === null) {
            return res.json({
                success: false,
                message: 'Error occured while loading Org Detail.'
            });
        } else {
            console.log('orgDetail',orgDetail);
            var data={};
            if(orgDetail.length>0){
                data={
                    name:orgDetail[orgDetail.length-1].name,
                    sysAdminId  : orgDetail[orgDetail.length-1].sysAdminId,
                    logo : orgDetail[orgDetail.length-1].logo,
                    id:orgDetail[orgDetail.length-1].id
                }
            }
            return res.json({
                success: true,
                data: data
            });
        }
    });
});

orgdetailRouter.post('/save', function (req, res) {
    var orgDetail = req.body;
    console.log('orgDetail',orgDetail);
    if( orgDetail.logofile !== undefined){
            fs.readFile(path.join(os.tmpdir(),orgDetail.logofile.fileName), function(err, fileData) {
                if (err){
                    console.error(err);
                    return res.json({
                        success: false,
                        message: 'Error occured while saving Org Detail.',
                        error: error
                    });
                }
                else{
                    global.db.MobileOrgDetail.destroy({
                        where: {
                            id: orgDetail.id,
                        }
                    }).then(function(deletedFieldsCount){
                        
                    // CREATE UserAction
                        global.db.MobileOrgDetail
                            .build({
                                logo: new Buffer(fileData).toString('base64'),
                                name: orgDetail.name,
                                sysAdminId: orgDetail.sysAdminId,
                            })
                            .save()
                            .then(function (newOrgDetail) {
                                return res.json({
                                    success: true,
                                    data: {
                                        newOrgDetail: newOrgDetail,
                                    }
                                });
                            })
                            .catch(function (error) {
                                return res.json({
                                    success: false,
                                    message: 'Error occured while saving Org Detail.',
                                    error: error
                                });
                            });
                            
                    })
                    .catch(function (error) {
                        return res.json({
                            success: false,
                            message: 'Error occured while saving Org Detail.',
                            error: error
                        });
                    });
                }
            });
    }
    else{
        global.db.MobileOrgDetail.destroy({
            where: {
                id: orgDetail.id,
            }
        }).then(function(deletedFieldsCount){
            
        // CREATE UserAction
            global.db.MobileOrgDetail
                .build({
                    logo: "",
                    name: orgDetail.name,
                    sysAdminId: orgDetail.sysAdminId,
                })
                .save()
                .then(function (newOrgDetail) {
                    return res.json({
                        success: true,
                        data: {
                            newOrgDetail: newOrgDetail,
                        }
                    });
                })
                .catch(function (error) {
                    return res.json({
                        success: false,
                        message: 'Error occured while saving Org Detail.',
                        error: error
                    });
                });
                
        })
        .catch(function (error) {
            return res.json({
                success: false,
                message: 'Error occured while saving Org Detail.',
                error: error
            });
        });
    };

});
orgdetailRouter.post('/upload', function(req, res){
    var form = new formidable.IncomingForm();
    var fileName;
    form.multiples = true;
    form.uploadDir = os.tmpdir();
    form.parse(req);

    form.on('file', function(field, file) {
        fileName = file.name+'_'+timestamp.now();
        fs.rename(file.path, path.join(form.uploadDir, file.isPrimary ? file.name+'_'+'primary'+'_'+timestamp.now() : file.name+'_'+timestamp.now()));
    });

    form.on('error', function(err) {
        return res.json({
            success: false,
            error: err
        });
    });

    form.on('end', function() {
        return res.json({
            success: true,
            fileName: fileName
        });
    });
});


module.exports = orgdetailRouter;