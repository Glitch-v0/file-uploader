import { body } from "express-validator";

export const nameValidationRules = (fieldName) => {
  return [
    body(fieldName)
      .trim()
      .notEmpty()
      .withMessage(`${fieldName} is required`)
      .isLength({ max: 32 })
      .withMessage(`${fieldName} must be at most 32 characters`)
      .matches(/^[A-Za-z\s'-]+$/)
      .withMessage(
        `${fieldName} must contain only letters, spaces, apostrophes, or hyphens`
      ),
  ];
};
