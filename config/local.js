require("dotenv").config();
const localConfig = {
    port: process.env.PORT || 3000,
    node_environment: process.env.ENVIRONMENT,
    database_url: process.env.LOCAL_DB_URL,
    notification_url:process.env.LOCAL_NOTIFICATION_URL,
    paystack_key:process.env.LOCAL_PAYSTACK_KEY
}

module.exports = localConfig;