import joi from "joi";

export const userRegistrationSchema = joi.object({
  username: joi.string().alphanum().min(3).max(30).required(),
  email: joi.string().email().required(),
  password: joi.string().min(8).required(),
  full_name: joi.string().min(1).max(100).required(),
});

export const userLoginSchema = joi.object({
  username: joi.string().alphanum().min(3).max(30).required(),
  password: joi.string().required(),
});

export const updateUserSchema = joi.object({
  username: joi.string().alphanum().min(3).max(30).optional(),
  full_name: joi.string().min(1).max(100).optional(),
  email: joi.string().email().optional(),
});

export const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body);

    if (error) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.details.map((detail) => detail.message),
      });
    }

    req.validatedData = value;
    next();
  };
};
