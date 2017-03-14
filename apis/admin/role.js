var express = require('express');
var roleRouter = express.Router();

roleRouter.post('/list', function(req, res){
    var Roles = db.Role.findAll({
        attributes: {
            exclude: ['createdAt','updatedAt']
        },
        where: {
            system: false
        }
    });
    
    Roles.then(function(roles) {
        if(roles === undefined || roles === null){
            return res.json({
                success: false,
                message: 'Error occured while loading user roles.'
            });
        }else{
            return res.json({
                success: true,
                data: {
                    roles: roles
                }
            });
        }
    });
});

roleRouter.post('/create', function(req, res){
    var roleToSave = req.body;

    var Role = db.Role.findOne({
        attributes: {
            exclude: ['createdAt','updatedAt']
        },
        where: {
            name: roleToSave.name.toUpperCase()
        }
    });
    
    Role.then(function(role) {
        if(role === null){
            // CREATE
            db.Role.create({
                name: roleToSave.name
            }).then(function(newRole){
                return res.json({
                    success: true,
                    data: {
                        role: newRole
                    }
                });
            }).catch(function(err){
                return res.json({
                    success: false,
                    message: 'Error occured while saving user role!',
                    error: err
                });
            });
        }else{
            return res.json({
                success: false,
                message: 'Duplicate entry found!'
            });
        }
    });
});

roleRouter.post('/update', function(req, res){
    var roleToSave = req.body;

    var Role = db.Role.findOne({
        attributes: {
            exclude: ['createdAt','updatedAt']
        },
        where: {
            name: roleToSave.name.toUpperCase(),
            id: {
                $ne: roleToSave.id
            }
        }
    });
    
    Role.then(function(role) {
        if(role === null){
            // CREATE
            db.Role.update({
                name: roleToSave.name
            },{
                where: {
                    id: roleToSave.id
                }
            }).then(function(){
                return res.json({
                    success: true,
                    data: {
                        role: roleToSave
                    }
                });
            }).catch(function(err){
                return res.json({
                    success: false,
                    message: 'Error occured while saving user role!',
                    error: err
                });
            });
        }else{
            return res.json({
                success: false,
                message: 'Duplicate entry found!'
            });
        }
    });
});

roleRouter.post('/delete', function(req, res){
    var role = req.body;
    global.db.Role.destroy({
        where: {
            name: role.name,
            default: false
        }
    }).then(function(affectedRows){
        if(affectedRows === 0){
            return res.json({
                success: false,
                message: 'Error occured while deleting role.\nMake sure it must not be default role in user mapping.'
            });
        }else{
            return res.json({
                success: true,
                data: {
                    role: role,
                    affectedRows: affectedRows
                }
            });
        }
    });
});

module.exports = roleRouter;