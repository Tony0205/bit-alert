const express = require('express')
const app = express()
const schedule = require('node-schedule');

function jobTest(req, res) {
    // let rule = new schedule.RecurrenceRule();
    // rule.second = 5; // 매 5초마다 실행하는 룰 (1분 5초, 2분 5초, 3분 5초와 같은식으로...)

    // 5초마다 실행 룰 생성
    let scheduleRule = '/5 * * * * *';

    let job = schedule.scheduleJob(scheduleRule, function() {
       console.log("5초마다 실행합니다."); 
    });

    console.log(job)

}

app.get('/', (req, res) => {
    console.log('시작');
    jobTest(req, res);
    res.send('Hello World!!!!');
})



app.listen(3000, () => console.log('Example app listening on port 3000!'))