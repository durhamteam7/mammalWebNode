/**
* @fileOverview
* @author Team 7
* @version 0.8
*/


var express = require("express");
var Sequelize = require("sequelize");
var bodyParser = require("body-parser");
var geolib = require("geolib");
var json2csv = require('json2csv');
var flatten = require('flat');



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
   camera_height: Sequelize.INTEGER,
   placement_id: Sequelize.INTEGER,
   lat: Sequelize.FLOAT,
   lon: Sequelize.FLOAT,
   grid_ref: Sequelize.STRING
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

var PersonStats = sequelize.define("PersonStats", {
    person_id: {
      type:Sequelize.INTEGER,
      primaryKey: true
    },
    species_rate: Sequelize.FLOAT,
    age_rate: Sequelize.FLOAT,
    gender_rate: Sequelize.FLOAT,
    number_rate: Sequelize.FLOAT,
    number_of_classifications: Sequelize.INTEGER
});

//Specify relations
Photo.hasMany(Classification,{foreignKey: 'photo_id',otherKey:'photo_id'});
Photo.hasMany(Animal,{foreignKey: 'photo_id',otherKey: 'photo_id'});
Photo.belongsTo(Site,{foreignKey: 'site_id'});



var getPhoto = function(req,res){


  formQueryJSON(req.body);

  //Set paging parameters if they were passed
  offsetValue = null;
  limitValue = null;
  if (!(req.query.hasOwnProperty("output") && req.query.output == "csv") && (req.query.hasOwnProperty("pageNum")&& req.query.hasOwnProperty("pageSize"))){
    offsetValue = (parseInt(req.query.pageNum)-1)*parseInt(req.query.pageSize);
    console.log(req.query.pageNum,req.query.pageSize);
    limitValue = parseInt(req.query.pageSize);
  }

  //Hide unclassified images

  if (req.body.Classification == undefined){
    req.body.Classification = {species:{}};
    req.body.Classification.classification_id = {$ne: null};
  }
  else{
    req.body.Classification.species.$in = req.body.Classification.species;
  }
  if(req.body.Classification.species == undefined){
    req.body.Classification.species = {};
  }

  req.body.Classification.species.$notIn = [86,96,97];



  //classification.$notIn = [86,96,97]; //Remove noAnimal, Don't know, Like
  console.log(req.body.Classification.species);
  //req.body.Classification.species = classification;


  //Deal with parameter for switching between sequence and photo
  if ((req.query.hasOwnProperty("sequence") && req.query.sequence == "true")){
    console.log("SEQUENCE MODE");
    //Deal with sequences by only returning photos which are first in a sequence
    if(!req.body.Photo){
      req.body.Photo = {};
    }
    req.body.Photo.sequence_num = 1;
  }

  console.log(req.body);
  //Build query JSON
  queryOptions = {
    where: req.body.Photo,
    include: [
            {model: Site,where:req.body.Site},
            {model: Classification,where:req.body.Classification}
        ],
    offset: offsetValue,
    limit: limitValue
  };

  //Run sequlize query
	Photo.findAndCountAll(queryOptions).then(function(result) {
      	filteredPhotos = [];

        //Remove sequalize's metadata
        photos = JSON.parse(JSON.stringify(result)).rows;

        //Normalize JSON structure so we can access any field by tableName.fieldName
        for(var i in photos){
          photos[i].Photo = {};
          for (var key in photos[i]){
            if (!(typeof photos[i][key] == "object" || typeof photos[i][key] == "array") ){
              //console.log(key)
              photos[i].Photo[key] = photos[i][key];
              delete photos[i][key];
            }
          }
          filteredPhotos.push(photos[i]);
        }
        result.rows = filteredPhotos;

        if (req.query.output=="csv"){ //CSV mode
          if (result.rows.length > 0){
          for (var i in result.rows){
            result.rows[i] = flatten(result.rows[i]);
          }
          json2csv({ data: result.rows}, function(err, csv) {
            if (err) console.log(err);
            res.send(csv);
          });
        }
        else{
          res.send("");
        }
        }
        else{
          res.send(result);
        }
    });

};


/** Returns personStats object
   * @param {object} req  request object
   * @param {object} res  response object
   * @returns {object} Array of personStats objects
*/
var getPersonStats = function(req,res){
  PersonStats.findAndCountAll({}).then(function(result) {
    res.send(result);
  });
};


/** Converts filter object into Sequalize query
   * @param {object} obj  filter object from client side
   * @returns {object} sequalize query object
*/
var formQueryJSON = function(obj){
  for (var key in obj){
    console.log(obj[key]);
    if (typeof obj[key] == "object" && !obj[key].hasOwnProperty("type")){
        //Recurse if the key is iself a valid object
        obj[key] = formQueryJSON(obj[key]);
    }
    else{
      //Deal with cases for each filter type
      if (obj[key].type == "slider"){

        //store values in temp variables
        var min = obj[key].minValue;
        var ceil = obj[key].options.ceil;
        var max = obj[key].maxValue;
        var floor = obj[key].options.floor;

        //Restructure object
        obj[key] = {};
        if (min != floor){ //if min is set
          obj[key].$gte = min;
        }
        if (max != ceil){ //if max is set
          obj[key].$lte = max;
        }
      }
      else if (obj[key].type == "dateTime"){

        //store values in temp variables
        var min = obj[key].minValue;
        var max = obj[key].maxValue;

        //restructure object
        obj[key] = {};
        if (min !== ""){ //if min set
          obj[key].$gte = new Date(min);
        }
        if (max !== ""){ //if max set
          obj[key].$lte = new Date(max);
        }
      }
      else if (obj[key].type == "coord" || obj[key].type == "radius"){
        if (obj[key].value !== null && key == "lat" && typeof obj.radius !== "undefined"){ //Only do once as calculation requires both fields
          var radius = obj.radius.value;
          coordType = obj[key].coordType;

          //Do geodesic calulation to find bounding square from initialPoint
          var initialPoint = {lat: obj.lat.value, lon: obj.lon.value};
          console.log(initialPoint,radius);
          var newPoints = geolib.getBoundsOfDistance(initialPoint,radius);
          console.log(newPoints);
          //restructure object
          obj[key] = {};
          obj[key].$gte = newPoints[0][coordType];
          obj[key].$lte = newPoints[1][coordType];

        }
        else{
          obj[key] = {};
        }
      }
      else{ //Treat everything else as simple field with value attribute
        console.log(key,obj[key].value);
        if (obj[key].value && obj[key].value.length !== 0){ //ignore blank values
          obj[key] = obj[key].value;
        }
        else{
          obj[key] = {}
        }
      }
  }
  }
  for (key in obj){
    //Remove empty objects
    console.log("sdfsfQQQQQ",obj[key])
    if (isEmpty(obj[key])){
      console.log("REMOVED")
      delete obj[key];
    }
  }
  return obj;


  }

/** Returns options object
   * @param {object} req  request object
   * @param {object} res  response object
   * @returns {object} Array of option objects
*/
var getOptions = function(req,res){
  Options.findAll().then(function(options){
    res.send(options);
  });
};

//sync the model with the database
sequelize.sync().then(function (err) {
	  console.log("Synced");
    //set routes
    app.post("/photo", getPhoto);
    app.get("/persons", getPersonStats);
    app.get("/options", getOptions);
    // initializing a port
    app.listen(port);
});


// Speed up calls to hasOwnProperty
var hasOwnProperty = Object.prototype.hasOwnProperty;

function isEmpty(obj) {

    // null and undefined are "empty"
    if (obj == null) return true;

    // Assume if it has a length property with a non-zero value
    // that that property is correct.
    if (obj.length > 0)    return false;
    if (obj.length === 0)  return true;

    // Otherwise, does it have any properties of its own?
    // Note that this doesn't handle
    // toString and valueOf enumeration bugs in IE < 9
    for (var key in obj) {
        if (hasOwnProperty.call(obj, key)) return false;
    }

    return true;
}





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
