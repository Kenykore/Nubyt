
require("dotenv").config();
const nodemailer = require("nodemailer");
const config=require("../config/index")
var hbs = require('nodemailer-express-handlebars');
const SendEmail = async (details={to:"",from:"",subject:"",template_name:"",bcc:undefined,replyTo:undefined}) => {
    try {
        console.log("sending mail started")
        const transportOptions = {
            host: 'smtp.office365.com',
            port: 587,
            auth: {
                user: process.env.SMTP_USERNAME,
                pass: process.env.SMTP_PASSWORD
            },
            tls: {
                // do not fail on invalid certs
                rejectUnauthorized: false
            }
        };
        var options = {
            viewEngine: {
                extname: '.hbs',
                layoutsDir: 'emails',
                defaultLayout: `${details.template_name}`,
                partialsDir: 'emails'
            },
            viewPath: 'emails',
            extName: '.hbs'
        };
        console.log("creating mail transporter")
        const transporter = nodemailer.createTransport(transportOptions);
        transporter.use('compile', hbs(options));
        console.log("complied mail transporter")
        console.log(config.node_environment,"node env")
        const emailPayload = {
            from: {
                name: details.from || "Nubyt",
                address: " support@nubyt.co"
            },
            to: details.to,
            replyTo: details.replyTo || "support@nubyt.co",
            bcc: details.bcc === undefined ? "moshood.korede@hotmail.com" : ["moshood.korede@hotmail.com", ...details.bcc],
            subject:config.node_environment !== "development" && config.node_environment !== "staging" ? details.subject:`[${config.node_environment}] ${details.subject}`,
            template: `${details.template_name}`,
            context: config.node_environment !== "development" && config.node_environment !== "staging" ? details.data :{mailType:`This mail is sent from the ${config.node_environment} platform, do not take action`,...details.data}
        };
        console.log("sending mail....")
        let res = await transporter.sendMail(emailPayload);
        console.log(res, "mail sent");
        return

    } catch (error) {
        console.log(error, "mail send error");
    }
};

module.exports = SendEmail;

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

