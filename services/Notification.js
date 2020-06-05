require("dotenv").config();
const config = require("../config/index");
//const nodemailer = require("nodemailer");
//const mg = require("nodemailer-mailgun-transport");
const fetch = require("node-fetch");
var nodemailer = require('nodemailer')
const Email = require('email-templates')
const selfSignedConfig = {
    service: 'gmail',
    auth: {
        user: 'comestiblestech@gmail.com',
        pass: 'franceskorede1@'
    }
}
/**
 * Function to send mail via our notification/queue service
 */
const SendEmail = async (details) => {
    try {
        return
        let transporter = nodemailer.createTransport(selfSignedConfig);
        await transporter.sendMail(details)

    } catch (error) {
        console.log(error);
    }
};

// const SendEmail = async (receiver, subject, email_template_name, data) => {
//     const mailgunConfig = {
//         auth: {
//             domain: config.mailgun.domain,
//             api_key: config.mailgun.api_key
//         }
//     };

//     const nodemailerMailgun = nodemailer.createTransport(mailgun(mailgunConfig));
//     const emailPayload = {
//         from: {
//             name: config.email.email_name,
//             address: config.email.main_email
//         },
//         to: receiver,
//         subject: subject,
//         template: {
//             name: `emails/${email_template_name}.hbs`,
//             engine: "handlebars",
//             context: data
//         }
//     };

//     await nodemailerMailgun.sendMail(emailPayload);
// };

module.exports = SendEmail;
