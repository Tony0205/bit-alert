var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var credentials = require('../credentials.json');

// create mysql connection pool
var pool  = mysql.createPool({
  connectionLimit : 5,
  host            : credentials.mysql.host,
  user            : credentials.mysql.user,
  password        : credentials.mysql.password,
  database        : credentials.mysql.database
});

/* POST schedule listing. */
router.post('/', function(req, res, next) {
  
  // parameter set
  // console.log(req.body);
  let sign = req.body["sign"];
  let standard_usd = req.body["standard_usd"];
  let interval_second = req.body["interval_second"];
  let noti_interval_minute = req.body["noti_interval_minute"];
  let noti_interval_repeat = req.body["noti_interval_repeat"];
  let noti_sending_email = req.body["noti_sending_email"];

  //create query
  let sql = `INSERT INTO scheduler
  (
    sign, 
    standard_usd, 
    interval_second,
    noti_interval_minute,
    noti_interval_repeat,
    noti_sending_email,
    noti_current_state
  )
  VALUES
  (
    "${sign}",
    "${standard_usd}",
    "${interval_second}",
    "${noti_interval_minute}",
    "${noti_interval_repeat}",
    "${noti_sending_email}",
    "stop"
  )`;



  let sql_response = {};

  pool.getConnection(function(err, connection) {
    if (err) throw err; // 연결이 되지 않으면 에러.

    // Use the connection
    connection.query(sql, function (error, results, fields) {      
      // And done with the connection.
      connection.release();
  
      // Handle error after the release.
      if (error) throw error;      
      
      // insert id 가 추출되면 정상적으로 insert가 된 것으로 볼 수 있음.
      if (results.insertId) {
        sql_response.insertId = results.insertId;
        sql_response.status = "success";
      }

      res.send(sql_response);
      res.end();
    })
  })

});


module.exports = router;
