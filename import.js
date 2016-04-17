var execsql = require('execsql'),
	dbConfig = {
		host: 'db4free.net',
		user: 'mammalweb',
		password: 'aliSwans0n'
	},
	sql = 'use mammalweb;',
	sqlFile = __dirname + '/Photo.sql';
execsql.config(dbConfig)
	.exec(sql)
	.execFile(sqlFile, function(err, results){
		console.log(err)
		console.log(results);
		execsql.end();

	}).end();