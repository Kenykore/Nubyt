require("dotenv").config();
const productionConfig = {
    port: process.env.PORT || 3000,
    node_environment: process.env.ENVIRONMENT,
    database_url: process.env.PRODUCTION_DB_URL,
    notification_url:process.env.PRODUCTION_NOTIFICATION_URL,
    paystack_key:process.env.PRODUCTION_PAYSTACK_KEY
}

module.exports = productionConfig;