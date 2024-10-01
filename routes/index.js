import express from "express";
import prismaClient from "../app.js";
import multer from "multer";
import { genPassword } from "../lib/passwordUtils.js";
import { body, validationResult } from "express-validator";
import { nameValidationRules } from "../lib/nameValidators.js";

export const router = express.Router();
const upload = multer({ dest: "./uploads/" });

router.get("/", (req, res, next) => {
  res.render("index", { errors: null, sentValues: null });
});

// User registration
router.post(
  "/",
  [
    body("email")
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Invalid email format"),
    ...nameValidationRules("firstName"),
    ...nameValidationRules("lastName"),
    body("password")
      .notEmpty()
      .withMessage("Password is required")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters long"),
    body("confirmPassword")
      .notEmpty()
      .withMessage("Confirm Password is required")
      .custom((value, { req }) => value === req.body.password)
      .withMessage("Passwords do not match"),
  ],
  async (req, res, next) => {
    const errors = validationResult(req).array();
    if (errors) {
      //sends back filled form with errors
      res.render("index", { errors: errors, sentValues: req.body });
      return;
    }
    const hashPassword = genPassword(req.body.password);
    const newUser = await prismaClient.user.create({
      data: {
        email: req.body.email,
        password_hash: hashPassword,
        first_name: req.body.firstName,
        last_name: req.body.lastName,
      },
    });
    console.log(`New user created! ${newUser}`);
    res.render("index", { sentValues: req.body });
  }
);

router.post("/login", async (req, res, next) => {});

router.get("/upload", (req, res, next) => {
  res.render("upload");
});

router.post("/upload", upload.single("file-upload"), (req, res, next) => {
  console.log(req.file);
  res.render("index");
  console.log(`File saved to ${req.file.path}`);
});

router.get("*", (req, res, next) => {
  res.redirect("/");
});
