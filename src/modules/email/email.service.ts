import { Injectable } from '@nestjs/common';
// import sgMail from '@sendgrid/mail';

// sgMail.setApiKey(process.env.SAND_GRID_API_KEY);

const mailjet = require('node-mailjet').connect(
  process.env.MAILJET_API,
  process.env.MAILJET_SECRET,
);

@Injectable()
export default class EmailService {
  // private nodemailerTransport: Mail;

  constructor() {
    // this.nodemailerTransport = createTransport({
    //   service: process.env.EMAIL_SERVICE,
    //   auth: {
    //     user: process.env.EMAIL_USER,
    //     pass: process.env.EMAIL_PASSWORD,
    //   },
    // });
  }

  sendMail(options) {
    // const msg = {
    //   to: options.to, // Change to your recipient
    //   from: process.env.EMAIL_USER, // Change to your verified sender
    //   subject: options.subject,
    //   text: options.text,
    //   // html: '',
    // };
    // console.log('SendGrid Message: ', msg);
    // return sgMail
    //   .send(msg)
    //   .then((response) => {
    //     console.log('SendGrid response: ', response[0].statusCode);
    //     console.log('SendGrid response: ', response[0].headers);
    //   })
    //   .catch((error) => {
    //     console.error('SendGrid Error: ', error);
    //   });

    const request = mailjet.post('send', { version: 'v3.1' }).request({
      Messages: [
        {
          From: {
            Email: process.env.EMAIL_USER,
            Name: process.env.EMAIL_SENDER_NAME,
          },
          To: [
            {
              Email: options.to,
              Name: options.name,
            },
          ],
          Subject: options.subject,
          TextPart: options.text,
          HTMLPart: '',
          CustomID: '',
        },
      ],
    });

    return request
      .then((result) => {
        console.log(result.body);
      })
      .catch((err) => {
        console.log(err.statusCode);
      });

    // return this.nodemailerTransport.sendMail(options);
  }
}
