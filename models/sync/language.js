module.exports = {
    sync: function(models, callback){
        var Language = models.Language;
        
        Language.sync().then(function(){
            Language.count().then(function(languageCount){
                if(languageCount === 0){
                    var languagesToCreate = getLanguageToCreate();
                    Language.bulkCreate(languagesToCreate).then(function(){
                        console.log("Languages created successfully!");
                        global.db.Translation.sync();
                        callback && callback();
                    });
                }else{
                    global.db.Translation.sync();
                    callback && callback();
                }
            });
        });
    }
};
var languageArray = [{key:"af",value:"Afrikaans"},{key:"ak",value:"Akan"},{key:"sq",value:"Albanian"},{key:"am",value:"Amharic"},{key:"ar",value:"Arabic"},{key:"hy",value:"Armenian"},{key:"az",value:"Azerbaijani"},{key:"eu",value:"Basque"},{key:"be",value:"Belarusian"},{key:"bem",value:"Bemba"},{key:"bn",value:"Bengali"},{key:"bh",value:"Bihari"},{key:"bs",value:"Bosnian"},{key:"br",value:"Breton"},{key:"bg",value:"Bulgarian"},{key:"km",value:"Cambodian"},{key:"ca",value:"Catalan"},{key:"chr",value:"Cherokee"},{key:"ny",value:"Chichewa"},{key:"zh-CN",value:"Chinese (Simplified)"},{key:"zh-TW",value:"Chinese (Traditional)"},{key:"co",value:"Corsican"},{key:"hr",value:"Croatian"},{key:"cs",value:"Czech"},{key:"da",value:"Danish"},{key:"nl",value:"Dutch"},{key:"xx-elmer",value:"Elmer Fudd"},{key:"en",value:"English"},{key:"eo",value:"Esperanto"},{key:"et",value:"Estonian"},{key:"ee",value:"Ewe"},{key:"fo",value:"Faroese"},{key:"tl",value:"Filipino"},{key:"fi",value:"Finnish"},{key:"fr",value:"French"},{key:"fy",value:"Frisian"},{key:"gaa",value:"Ga"},{key:"gl",value:"Galician"},{key:"ka",value:"Georgian"},{key:"de",value:"German"},{key:"el",value:"Greek"},{key:"gn",value:"Guarani"},{key:"gu",value:"Gujarati"},{key:"xx-hacker",value:"Hacker"},{key:"ht",value:"Haitian Creole"},{key:"ha",value:"Hausa"},{key:"haw",value:"Hawaiian"},{key:"iw",value:"Hebrew"},{key:"hi",value:"Hindi"},{key:"hu",value:"Hungarian"},{key:"is",value:"Icelandic"},{key:"ig",value:"Igbo"},{key:"id",value:"Indonesian"},{key:"ia",value:"Interlingua"},{key:"ga",value:"Irish"},{key:"it",value:"Italian"},{key:"ja",value:"Japanese"},{key:"jw",value:"Javanese"},{key:"kn",value:"Kannada"},{key:"kk",value:"Kazakh"},{key:"rw",value:"Kinyarwanda"},{key:"rn",value:"Kirundi"},{key:"xx-klingon",value:"Klingon"},{key:"kg",value:"Kongo"},{key:"ko",value:"Korean"},{key:"kri",value:"Krio (Sierra Leone)"},{key:"ku",value:"Kurdish"},{key:"ckb",value:"Kurdish (Soranî)"},{key:"ky",value:"Kyrgyz"},{key:"lo",value:"Laothian"},{key:"la",value:"Latin"},{key:"lv",value:"Latvian"},{key:"ln",value:"Lingala"},{key:"lt",value:"Lithuanian"},{key:"loz",value:"Lozi"},{key:"lg",value:"Luganda"},{key:"ach",value:"Luo"},{key:"mk",value:"Macedonian"},{key:"mg",value:"Malagasy"},{key:"ms",value:"Malay"},{key:"ml",value:"Malayalam"},{key:"mt",value:"Maltese"},{key:"mi",value:"Maori"},{key:"mr",value:"Marathi"},{key:"mfe",value:"Mauritian Creole"},{key:"mo",value:"Moldavian"},{key:"mn",value:"Mongolian"},{key:"sr-ME",value:"Montenegrin"},{key:"ne",value:"Nepali"},{key:"pcm",value:"Nigerian Pidgin"},{key:"nso",value:"Northern Sotho"},{key:"no",value:"Norwegian"},{key:"nn",value:"Norwegian (Nynorsk)"},{key:"oc",value:"Occitan"},{key:"or",value:"Oriya"},{key:"om",value:"Oromo"},{key:"ps",value:"Pashto"},{key:"fa",value:"Persian"},{key:"xx-pirate",value:"Pirate"},{key:"pl",value:"Polish"},{key:"pt-BR",value:"Portuguese (Brazil)"},{key:"pt-PT",value:"Portuguese (Portugal)"},{key:"pa",value:"Punjabi"},{key:"qu",value:"Quechua"},{key:"ro",value:"Romanian"},{key:"rm",value:"Romansh"},{key:"nyn",value:"Runyakitara"},{key:"ru",value:"Russian"},{key:"gd",value:"Scots Gaelic"},{key:"sr",value:"Serbian"},{key:"sh",value:"Serbo-Croatian"},{key:"st",value:"Sesotho"},{key:"tn",value:"Setswana"},{key:"crs",value:"Seychellois Creole"},{key:"sn",value:"Shona"},{key:"sd",value:"Sindhi"},{key:"si",value:"Sinhalese"},{key:"sk",value:"Slovak"},{key:"sl",value:"Slovenian"},{key:"so",value:"Somali"},{key:"es",value:"Spanish"},{key:"es-419",value:"Spanish (Latin American)"},{key:"su",value:"Sundanese"},{key:"sw",value:"Swahili"},{key:"sv",value:"Swedish"},{key:"tg",value:"Tajik"},{key:"ta",value:"Tamil"},{key:"tt",value:"Tatar"},{key:"te",value:"Telugu"},{key:"th",value:"Thai"},{key:"ti",value:"Tigrinya"},{key:"to",value:"Tonga"},{key:"lua",value:"Tshiluba"},{key:"tum",value:"Tumbuka"},{key:"tr",value:"Turkish"},{key:"tk",value:"Turkmen"},{key:"tw",value:"Twi"},{key:"ug",value:"Uighur"},{key:"uk",value:"Ukrainian"},{key:"ur",value:"Urdu"},{key:"uz",value:"Uzbek"},{key:"vi",value:"Vietnamese"},{key:"cy",value:"Welsh"},{key:"wo",value:"Wolof"},{key:"xh",value:"Xhosa"},{key:"yi",value:"Yiddish"},{key:"yo",value:"Yoruba"},{key:"zu",value:"Zulu"}];

var getLanguageToCreate = function(){
    var languageToCreate = [];
    languageArray.forEach(function(language){
        if(language.key === 'en'){
            languageToCreate.push({code: language.key, name: language.value, created:true, active:true, default:true});    
        }
        else{
            languageToCreate.push({code: language.key, name: language.value});
        }
    });
    return languageToCreate;
};