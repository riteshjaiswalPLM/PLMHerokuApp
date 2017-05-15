salesforce ={};
salesforce.salesforce = ()=>{
   var Sfdcs = db.Salesforce.findAll({
        attributes: {
            exclude: ['createdAt','updatedAt']
        },
        include: [{
            model: db.TimeZone,
            attributes: {
                exclude: ['createdAt','updatedAt']
            }
        },{
            model: db.Locale,
            attributes: {
                exclude: ['createdAt','updatedAt']
            }
        }]
    });

    Sfdcs.then(function(sfdc){
        if(sfdc !== undefined && sfdc.length > 0){
            global.salesforce.config = sfdc[0];
        }
    });
}
salesforce.salesforce();
module.exports = salesforce;