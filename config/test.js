require("dotenv").config();
const testConfig = {
    port: process.env.PORT || 3000,
    node_environment: process.env.ENVIRONMENT,
    database_url: process.env.TEST_DB_URL,
    notification_url:process.env.TEST_NOTIFICATION_URL,
 
}

module.exports = testConfig;