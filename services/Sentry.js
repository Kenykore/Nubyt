const config = require("../config/index");
const Sentry = require('@sentry/node');
if(process.env.ENVIRONMENT !== "development"){
    Sentry.init({ 
        environment: config.node_environment,
        dsn: config.sentry.dsn,
    });
}

const SentryLog = {
    ErrorReporting(error){
        console.log(error);
        if(config.node_environment !== "development" && config.node_environment !== "test"){
            return Sentry.captureException(error);
        }
    }
}

module.exports = SentryLog;