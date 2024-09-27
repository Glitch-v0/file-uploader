import express from "express";
import prismaClient from "../app.js";
import multer from "multer";
import { genPassword } from "../lib/passwordUtils.js";
import { body, validationResult } from "express-validator";
import { nameValidationRules } from "../lib/nameValidators.js";

export const router = express.Router();
const upload = multer({ dest: "./uploads/" });

router.get("/", (req, res, next) => {
  res.render("index", { sentValues: null });
});

router.post("/", async (req, res, next) => {
  const hashPassword = genPassword(req.body.password);
  const newUser = await prismaClient.user.create({
    data: {
      username: req.body.username,
      password_hash: hashPassword,
      first_name: req.body.firstName,
      last_name: req.body.lastName,
    },
  });
  console.log(`New user created! ${newUser}`);
  res.render("index", { sentValues: req.body });
});

router.get("/upload", (req, res, next) => {
  res.render("upload");
});

router.post("/upload", upload.single("file-upload"), (req, res, next) => {
  console.log(req.file);
  res.render("index");
  console.log(`File saved to ${req.file.path}`);
});
