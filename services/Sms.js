const fetch = require("node-fetch");
require("dotenv").config();
const config = require("../config/index");
/**
 * Function to send sms via our notifications/queue service
 */
const SendSMS = async body => {
    try {
        if (config.node_environment === "test" || config.node_environment==="development") {
            return true
        }
        await fetch("https://notifications.mvxchange.com/sms", {
            method: "POST",
            body: JSON.stringify(body),
            headers: { "Content-Type": "application/json" }
        });
    } catch (error) {
        console.log(error);
    }
};

module.exports = SendSMS;
