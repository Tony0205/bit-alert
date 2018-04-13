var credentials = require('../credentials.json');

var send = require('gmail-send')({
    //var send = require('../index.js')({
    user: credentials.user,                  // Your GMail account used to send emails
    pass: credentials.pass,                  // Application-specific password
    // to:   'maialalgm@gmail.com',
    // to:   credentials.user,                  // Send to yourself
                                            // you also may set array of recipients:
                                            // [ 'user1@gmail.com', 'user2@gmail.com' ]
    // from:    credentials.user,            // from: by default equals to user
    // replyTo: credentials.user,            // replyTo: by default undefined
    // bcc: 'some-user@mail.com',            // almost any option of `nodemailer` will be passed to it
    // subject: '',
    // text:    '',         // Plain text
    //html:    '<b>html text</b>'            // HTML
});


module.exports = class Emailnotify {
    constructor(subject, text, to){
        this.subject = subject;
        this.text = text;
        this.to = to;
    }

    mailsending() {
        console.log('* sending email start!');

        send(
            {
                subject : this.subject,
                text : this.text,
                to : this.to
            
            }, function (err, res) {        
                if ( err == null && res.includes('OK') ) {
                    console.log('Email sending success!');
                    console.log('* send() callback returned: err:', err, '; res:', res);        
                
                } else{
                    console.log('Email sending fail!');
                    console.log('* send() callback returned: err:', err, '; res:', res);
                }
            }
        );
    }
}





