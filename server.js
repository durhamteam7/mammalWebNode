// get dependencies
var express = require("express");
var Sequelize = require("sequelize");
var bodyParser = require("body-parser");
var geolib = require("geolib");
var json2csv = require('json2csv'); 
var flatten = require('flat')
var app = express();

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: false })); // for parsing application/x-www-form-urlencoded

app.use(function(req, res, next) {
    var oneof = false;
    if(req.headers.origin) {
        res.header('Access-Control-Allow-Origin', req.headers.origin);
        oneof = true;
    }
    if(req.headers['access-control-request-method']) {
        res.header('Access-Control-Allow-Methods', req.headers['access-control-request-method']);
        oneof = true;
    }
    if(req.headers['access-control-request-headers']) {
        res.header('Access-Control-Allow-Headers', req.headers['access-control-request-headers']);
        oneof = true;
    }
    if(oneof) {
        res.header('Access-Control-Max-Age', 60 * 60 * 24 * 365);
    }

    // intercept OPTIONS method
    if (oneof && req.method == 'OPTIONS') {
        res.send(200);
    }
    else {
        next();
    }
});



var port = process.env.PORT || 8080;

var sequelize = new Sequelize('mammalweb', 'mammalweb', 'aliSwans0n', {
  host: 'db4free.net',
  dialect: 'mysql',

  pool: {
    max: 5,
    min: 0,
    idle: 10000
  },
  define:{
  	freezeTableName: true,
  	timestamps: false
  },
  logging:false


});



var Photo = sequelize.define("Photo", {
    photo_id: {
    	type:Sequelize.INTEGER,
    	primaryKey: true
    },
    filename: Sequelize.STRING,
    upload_filename: Sequelize.STRING,
    dirname: Sequelize.STRING,
    upload_id: Sequelize.INTEGER,
    site_id: Sequelize.INTEGER,
    person_id: Sequelize.INTEGER,
    taken: Sequelize.DATE,
    size: Sequelize.INTEGER,
    sequence_id: Sequelize.INTEGER,
    sequence_num: Sequelize.INTEGER,
    prev_photo: Sequelize.INTEGER,
    next_photo: Sequelize.INTEGER,
    contains_human: Sequelize.INTEGER,
    uploaded: Sequelize.DATE
});


var Classification = sequelize.define("Classification", {
    classification_id: {
    	type:Sequelize.INTEGER,
    	primaryKey: true
    },
    photo_id: Sequelize.INTEGER,
    species: Sequelize.INTEGER,
    gender: Sequelize.INTEGER,
    age: Sequelize.INTEGER,
    evenness: Sequelize.INTEGER,
    fraction_support: Sequelize.INTEGER,
    fraction_blanks: Sequelize.INTEGER,
    number_of_classifications: Sequelize.INTEGER
},{name: {plural: 'Classification'}});

var Site = sequelize.define("Site", {
   site_id: {
    	type:Sequelize.INTEGER,
    	primaryKey: true
    },
   site_name: Sequelize.STRING,
   person_id: Sequelize.INTEGER,
   landuse_id: Sequelize.INTEGER,
   habitat_id: Sequelize.INTEGER,
   water_id: Sequelize.INTEGER,
   purpose_id: Sequelize.INTEGER,
   notes: Sequelize.STRING,
   camera_id: Sequelize.INTEGER,
   placement_id: Sequelize.INTEGER,
   lat: Sequelize.FLOAT,
   lon: Sequelize.FLOAT  
});

var Animal = sequelize.define("Animal", {
    animal_id: {
    	type:Sequelize.INTEGER,
    	primaryKey: true
    },
    photo_id: Sequelize.INTEGER,
    person_id: Sequelize.INTEGER,
    species: Sequelize.INTEGER,
});

var Options = sequelize.define("Options", {
    option_id: {
      type:Sequelize.INTEGER,
      primaryKey: true
    },
    struc: Sequelize.INTEGER,
    option_name: Sequelize.INTEGER,
    seq: Sequelize.INTEGER,
    article_id: Sequelize.INTEGER
});

//Specify relations
Photo.hasMany(Classification,{foreignKey: 'photo_id',otherKey:'photo_id'});
Photo.hasMany(Animal,{foreignKey: 'photo_id',otherKey: 'photo_id'});
Photo.hasOne(Site,{foreignKey: 'site_id'});


var getPhoto = function(req,res){
  //Set the val field to the actual key
  formQueryJSON(req.body)
  //console.log(req.body)
  //console.log(req.query.pageNum,req.query.pageSize)

  offsetValue = null;
  limitValue = null;

  if (!(req.query.hasOwnProperty("output") && req.query.output == "csv")){
    offsetValue = (parseInt(req.query.pageNum)-1)*parseInt(req.query.pageSize);
    console.log(req.query.pageNum,req.query.pageSize)
    limitValue = parseInt(req.query.pageSize)
  }


  queryOptions = {
    where: req.body["Photo"],
    include: [
            {model: Site, as: Site.tableName,where:req.body["Site"]},
            //{model: Animal},
            {model: Classification,where:req.body["Classification"]}
        ],
    offset: offsetValue,
    limit: limitValue
  }


	Photo.findAndCountAll(queryOptions).then(function(result) {
      	//have to mannually filter number of animals
      	/*filteredPhotos = []
      	for(i in photos){
      		if(photos[i].Animals && photos[i].Animals.length >= 1){      			
      			filteredPhotos.push(photos[i]);
      		}
      	}
    		res.send(filteredPhotos);*/
        //console.log(req.query.output)
        if (req.query.output=="csv"){
          result = JSON.parse(JSON.stringify(result))
          console.log(result)
          for (i in result.rows){
            result.rows[i] = flatten(result.rows[i])
          }
          //console.log(result.rows)
          //console.log("hath taketh the funtion")        
          json2csv({ data: result.rows}, function(err, csv) {
            if (err) console.log(err)
            //console.log(csv);
            res.send(csv);
          });
        }
        else{
          //console.log(result)
          res.send(result);
        }
    });

}




var formQueryJSON = function(obj){
  for (var key in obj){
    if (typeof obj[key] == "object" && !obj[key].hasOwnProperty("type")){
        obj[key] = formQueryJSON(obj[key]);
    }
    else{
    if (obj[key]["type"] == "slider"){
      var min = obj[key]["minValue"];
      var ceil = obj[key]["options"]["ceil"];
      var max = obj[key]["maxValue"];
      var floor = obj[key]["options"]["floor"];
      obj[key] = {};
      if (min != floor){
        obj[key]["$gte"] = min;
      }
      if (max != ceil){
        obj[key]["$lte"] = max;
      }
    }
    else if (obj[key]["type"] == "dateTime"){
      var min = obj[key]["minValue"];
      var max = obj[key]["maxValue"];
      obj[key] = {};
      if (min != ""){
        obj[key]["$gte"] = new Date(min);
      }
      if (max != ""){
        obj[key]["$lte"] = new Date(max);
      }
    }
    else if (obj[key]["type"] == "coord"){
      if (obj[key]["value"] != null && key == "lat"){
        var radius = 50000;

        coordType = obj[key]["coordType"];
        var initialPoint = {lat: obj["lat"]["value"], lon: obj["lon"]["value"]}
        var newPoints = geolib.getBoundsOfDistance(initialPoint,radius);

        console.log("INIT",initialPoint)
        console.log(newPoints);
        obj[key] = {};
        obj[key]["$gte"] = newPoints[0][coordType];
        obj[key]["$lte"] = newPoints[1][coordType];
      }
      else{
        obj[key] = {};
      }
    }
    else{
      if (obj[key]["value"].length != 0){
        obj[key] = obj[key]["value"]; 
      }
      else{
        obj[key] = {}
      }
    }
  }
  }
  //console.log(obj)
  for (var key in obj){
    if (Object.keys(obj[key]).length === 0){
      delete obj[key];
    }
  }
  return obj


  }

var getOptions = function(req,res){
  Options.findAll().then(function(options){
    res.send(options);
  });
};

//sync the model with the database
sequelize.sync().then(function (err) {
	console.log("Synced");
    app.post("/photo", getPhoto);
    app.get("/options", getOptions);
    // initializing a port
    app.listen(port);
});





/*var formQueryJSON = function(obj){
  if (!obj.hasOwnProperty("type")){
    for (var key in obj){
      obj[key] = formQueryJSON(obj[key]);
      if (Object.keys(obj[key]).length === 0){
        delete obj[key];
      }
    }
  }
  else{
    if (obj["type"] == "slider"){
      var min = obj["minValue"];
      var ceil = obj["options"]["ceil"];
      var max = obj["maxValue"];
      var floor = obj["options"]["floor"];
      obj = {};
      if (min != floor){
        obj["$gte"] = min;
      }
      if (max != ceil){
        obj["$lte"] = max;
      }
    }
    else if (obj["type"] == "dateTime"){
      var min = obj["minValue"];
      var max = obj["maxValue"];
      obj = {};
      if (min != ""){
        obj["$gte"] = new Date(min);
      }
      if (max != ""){
        obj["$lte"] = new Date(max);
      }
    }
    else if (obj["type"] == "coord"){
      if (obj["value"] != null){
        var radius = 50000;
        var coordType = obj["coordType"];
        if (obj["coordType"] == "latitude"){
          var initialPoint = {lat: obj["value"], lon: -0.1}
          var initialPoint = {lat:54.77524999999999,lon:-1.5857361512621808}
          var newPoints = geolib.getBoundsOfDistance(initialPoint,radius);
        } 
        else{
          var initialPoint = {lat: 54, lon: obj["value"]}
          var initialPoint = {lat:54.77524999999999,lon:-1.5857361512621808}
          var newPoints = geolib.getBoundsOfDistance(initialPoint,radius);
        }
        console.log("INIT",initialPoint)
        console.log(newPoints);
        obj = {};
        obj["$gte"] = newPoints[0][coordType];
        obj["$lte"] = newPoints[1][coordType];
      }
      else{
        obj = {};
      }

    }
    else{
      if (obj["value"].length != 0){
        obj = obj["value"]; 
      }
      else{
        obj = {}
      }
    }
  }
  return obj;

}*/

