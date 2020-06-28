const Joi = require("@hapi/joi");

const ValidatePostCreation = (params) => {
    const schema = Joi.object({
        title: Joi.string().required(),
        user_id:Joi.string().required(),
        description:Joi.string().optional(),
        media: Joi.string().required(),
        media_id:Joi.string().required()
    });
    return schema.validate(params, {
        allowUnknown: true
    });
}

module.exports = ValidatePostCreation;
