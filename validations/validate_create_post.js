const Joi = require("@hapi/joi");

const ValidatePostCreation = (params) => {
    const schema = Joi.object({
        user_id:Joi.string().required(),
        media:Joi.string().required(),
        description:Joi.string().required(),
        media_id:Joi.string().required()
    });
    return schema.validate(params, {
        allowUnknown: true
    });
}

module.exports = ValidatePostCreation;
