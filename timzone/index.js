timezone ={};
timezone.list=[];
timezone.timezone = ()=>{
   timezone.list=[];
   var findAllTimeZone = global.db.TimeZone.findAll({
        attributes: {
            exclude: ['createdAt','updatedAt']
        },
        where: null 
    });

    findAllTimeZone.then(function(timezones){
        timezones.forEach(function(timezone){
            global.timezone.list.push(timezone);
        });
        global.timezone.list.sort((a, b)=>{
            var val1 = parseFloat(a.name.substr(a.name.indexOf('GMT')+3, a.name.indexOf(')')-4).replace(':','.'));
            var val2 = parseFloat(b.name.substr(b.name.indexOf('GMT')+3, b.name.indexOf(')')-4).replace(':','.'));
            if(val1 < val2) return 1;
            else if(val1 > val2) return -1;
            else return 0;
        });
    });
}
timezone.timezone();
module.exports = timezone;