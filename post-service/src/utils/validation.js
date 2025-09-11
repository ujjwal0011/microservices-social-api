import joi from "joi";

export const createPostSchema = joi.object({
  content: joi.string().required().messages({
    "string.empty": "Content is not allowed to be empty",
    "any.required": "Content is a required field",
  }),
  media_url: joi.string().uri().optional().allow(null, "").messages({
    "string.uri": "Media URL must be a valid URI",
  }),
  comments_enabled: joi.boolean().optional(),
  scheduled_at: joi
    .date()
    .iso()
    .greater("now")
    .optional()
    .allow(null)
    .messages({
      "date.greater": "Scheduled time must be in the future",
      "date.format": "Scheduled time must be in a valid ISO 8601 format",
    }),
});

export const updatePostSchema = joi
  .object({
    content: joi.string().optional(),
    media_url: joi.string().uri().optional().allow(null, ""),
  })
  .min(1)
  .messages({
    "object.min":
      "At least one field (content or media_url) is required to update.",
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
