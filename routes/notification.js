const express = require('express');
const router = express.Router();
const mysql = require('promise-mysql');
const cheerio = require('cheerio'); // Basically jQuery for node.js
const puppeteer = require('puppeteer');
const Email = require('./email_notify.js');
var credentials = require('../credentials.json');

// const rp = require('request-promise');


// create mysql connection pool
const pool  = mysql.createPool({  
  host            : credentials.mysql.host,
  user            : credentials.mysql.user,
  password        : credentials.mysql.password,
  database        : credentials.mysql.database,
  connectionLimit : 5,
});


// 타이머가 모여있는 객체들...
const timers = {};

/* notification - POST */
router.post('/', async function(req, res, next) {   
  
  // return timer object
  let timer_object;
  
  // parameter set
  // console.log(req.body);
  let noti_id = req.body["id"];
  
  let i = 1;

  try {
    // puppeteer launch
    let browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']}) // 브라우저 인스턴스를 만들고
    let page = await browser.newPage() // 페이지를 연다

    await page.goto('https://www.bitmex.com/app/trade/XBTUSD') // 비트맥스 사이트 진입

    // 알람 시작을 위한 row select
    let sel_sql = `SELECT * FROM scheduler WHERE id = "${noti_id}"`;

    let result_row = await pool.query(sel_sql).catch(function(err) {
      throw new Error(err);
    });

    // 알람 시작 상태변경 쿼리
    notiStartQuery(noti_id);

    let sec = result_row[0].interval_second * 1000; // Set Interval Seocond

    // console.log(result_row);

    let timer_object = setInterval(notiCheck, sec, result_row[0], page, browser); // sec 뒤로는 전부 interval function의 parameter로 들어감.
    
    timers[noti_id] = timer_object;

    res.send('success')

  } catch (error) {
    throw new Error(400);

  }

  // using in setInterval function
  async function notiCheck(row, page, browser) {   
    try {
      let html = await page.content()
      let $ = cheerio.load(html);

      let current_usd_price = $('#content > div > span > div.sideWrap.left.tradeSidebar.hidden-xs.preview.responsiveOpen > div > div.orderControls.basic > li > ul > div > div > div.lastPriceWidget > span').text();
      
      // 실시간 비트맥스 usd price
      let bitmax_usd = current_usd_price;
      let standard_usd = row.standard_usd;

      // console.log("bitmax usd?", bitmax_usd);
      // console.log("our standard usd?", standard_usd);
      // console.log("row.sign?", row.sign);
      console.log(`${row.id}번 코드 알림의 ${i}번째...`);
      
      if (i == 5) {
        await browser.close()
        notiStop(row);
      }

      switch (row.sign) {
        case ">":
          if (bitmax_usd > standard_usd) {
            i++;
            notify(row, bitmax_usd, "이상");
            // console.log('이상');           
          }
          break;
        
        case "<":
          if (bitmax_usd < standard_usd) {
            i++;
            notify(row, bitmax_usd, "미만");
            // console.log('미만');
          }
          
          break;
      
        default:        
          if (bitmax_usd == standard_usd) {
            i++;
            notify(row, bitmax_usd, "같음");
            // console.log('같음');
          }
          break;
      }      
      
    } catch (error) {
        throw new Error(400)
    }


  }


  function notify(row, bitmax_usd, sign){
    let subject, text = "";
    let to = row.noti_sending_email; // 알림을 받는 대상.

    subject = `비트맥스USD 값이 알람 세팅 값인 ${row.standard_usd}USD ${sign}이 되었습니다.`;
    text = `
    현재 비트맥스 USD : ${bitmax_usd}USD
    알람 세팅 값 : ${row.standard_usd}USD
    
    현재, 비트맥스USD(${bitmax_usd}USD) 값이 알람 세팅 값인 ${row.standard_usd}USD ${sign}이 되었습니다.

    확인 바랍니다.
    `;

    const mail = new Email(subject, text, to);

    mail.mailsending();
  }    


  
});

router.post('/stop', function(req, res, next) {
  // console.log('스탑으로 옴');
  let row = {};
  row.id = req.body["id"]; // 파라미터 형태를 맞춰줌.

  // console.log("객체 존재함???", timers[row.id]);
  
  // 알림 정지 함수.
  notiStop(row)

  res.send("성공");
});




async function notiStop(row) {
  try {
    console.log('알림 정지 function 진입');

    clearInterval(timers[row.id]);
    
    let update_sql = `UPDATE scheduler SET noti_current_state = "stop" WHERE id = "${row.id}"`;

    let result_row = await pool.query(update_sql).catch(function(err) {
      console.log(err);
    });

    delete timers[row.id];
    
    console.log(`${row.id}번 알람이 정상적으로 종료되었습니다.`);
    console.log(timers);

  } catch (error) {
    throw new Error(error);
  }
}

async function notiStartQuery(id) {
  try {
    // 알람이 시작되었다는 update
    let update_sql = `UPDATE scheduler SET noti_current_state = "start" WHERE id = "${id}"`;

    let update_row = await pool.query(update_sql).catch(function(err) {
      console.log(err);
    });

    if (update_row.affectedRows == 1) {
      console.log("notify flag changes : start");
    }

  } catch (error) {
    throw new Error(error);  
  }

}


module.exports = router;
