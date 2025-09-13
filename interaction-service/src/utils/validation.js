import joi from "joi";

export const createCommentSchema = joi.object({
  content: joi.string().min(1).max(1000).required().messages({
    "string.empty": "Comment content cannot be empty.",
    "any.required": "Content is a required field.",
  }),
});

export const updateCommentSchema = joi.object({
  content: joi.string().min(1).max(1000).required().messages({
    "string.empty": "Comment content cannot be empty.",
    "any.required": "Content is a required field.",
  }),
});

export const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: error.details.map((detail) => detail.message),
      });
    }

    req.validatedData = value;
    next();
  };
};
