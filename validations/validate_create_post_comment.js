const Joi = require("@hapi/joi");

const ValidatePostComment = (params) => {
    const schema = Joi.object({
        user_id:Joi.string().required(),
        post_id:Joi.string().required(),
        comment_type:Joi.string().required(),
        description:Joi.string().required(),comment_id:Joi.when(' comment_type', {
            is: 'reply',
            then: Joi.string().required(),
            otherwise: Joi.string().optional()
        }),
    });
    return schema.validate(params, {
        allowUnknown: true
    });
}

module.exports = ValidatePostComment;
