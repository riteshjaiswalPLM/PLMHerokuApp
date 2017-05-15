locale ={};
locale.list=[];
locale.locale = ()=>{
   locale.list=[];
   var findAllLocale = global.db.Locale.findAll({
        attributes: {
            exclude: ['createdAt','updatedAt']
        },
        where: null 
    });

    findAllLocale.then(function(locales){
        locales.forEach(function(locale){
            global.locale.list.push(locale);
        });
        
    });
}
locale.locale();
module.exports = locale;