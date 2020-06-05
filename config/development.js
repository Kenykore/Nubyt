require("dotenv").config();
const devConfig = {
    port: process.env.PORT || 3000,
    node_environment: process.env.ENVIRONMENT,
    database_url: process.env.DEV_DB_URL,
    notification_url:process.env.DEV_NOTIFICATION_URL,
    paystack_key:process.env.DEV_PAYSTACK_KEY
}

module.exports = devConfig;