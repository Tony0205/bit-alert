var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var credentials = require('../credentials.json');

// create mysql connection pool
var pool  = mysql.createPool({
  connectionLimit : 3,
  host            : credentials.mysql.host,
  user            : credentials.mysql.user,
  password        : credentials.mysql.password,
  database        : credentials.mysql.database
});

/* GET home page. */
router.get('/', function(req, res, next) {
  
  let result_data = {};

  pool.getConnection(function(err, connection) {
    if (err) throw err; // 연결이 되지 않으면 에러.

    let sql = `
      SELECT *, DATE_FORMAT(create_date, "%Y/%m/%d %r") as create_date FROM scheduler
    `;

    // Use the connection
    connection.query(sql, function (error, results, fields) {      
      // And done with the connection.
      connection.release();
  
      // Handle error after the release.
      if (error) throw error;
      
      // console.log(results);

      res.render('index', { row : results });
    })
    
  })

  
});

module.exports = router;
