// get dependencies
var express = require("express");
var Sequelize = require("sequelize");
var bodyParser = require("body-parser");
var app = express();


app.all('/*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With, Content-Type");
  res.header("Access-Control-Allow-Methods", "GET, POST","PUT");
  next();
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
    species: Sequelize.INTEGER
});

var Site = sequelize.define("Site", {
   site_id: {
    	type:Sequelize.INTEGER,
    	primaryKey: true
    },
   site_name: Sequelize.STRING
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

//Specify relations
Photo.hasMany(Classification,{foreignKey: 'photo_id',otherKey:'photo_id'});
Photo.hasMany(Animal,{foreignKey: 'photo_id',otherKey: 'photo_id'});
Photo.hasOne(Site,{foreignKey: 'site_id'});

var getPhoto = function(req,res){
	Photo.findAll({
		where: {photo_id:2},
		include: [
		        {model: Site, as: Site.tableName},
		        {model: Animal},
		        {model: Classification,where:{species:22}}
		    ]
      }).then(function(photos) {
      	//have to mannually filter number of animals
      	filteredPhotos = []
      	for(i in photos){
      		if(photos[i].Animals.length >= 1){
      			filteredPhotos.push(photos[i]);
      		}
      	}
    		res.send(filteredPhotos);
    });

}

//sync the model with the database
sequelize.sync().then(function (err) {
	console.log("Synced");
    app.get("/photo", getPhoto);
    // initializing a port
    app.listen(port);
});


