const Joi = require("@hapi/joi");

const ValidateChat = (params) => {
    const schema = Joi.object({
        user_id:Joi.string().required(),
        recipient_id:Joi.string().required(),
        message_type:Joi.string().required(),
    });
    return schema.validate(params, {
        allowUnknown: true
    });
}

module.exports = ValidateChat;
