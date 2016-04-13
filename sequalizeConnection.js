var Sequelize = require("sequelize");


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
   site_name: Sequelize.STRING,
   person_id: Sequelize.INTEGER,
   landuse_id: Sequelize.INTEGER,
   habitat_id: Sequelize.INTEGER,
   water_id: Sequelize.INTEGER,
   purpose_id: Sequelize.INTEGER,
   notes: Sequelize.STRING,
   camera_id: Sequelize.INTEGER,
   placement_id: Sequelize.INTEGER
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


module.exports = sequalize;