const router = require("express").Router();
const passport = require("passport");
const genPassword = require("../lib/passwordUtils").genPassword;
// const { body, validationResult } = require("express-validator");
// const { nameValidationRules } = require("../validators/nameValidators");
const multer = require("multer");
const upload = multer({ dest: "./uploads/" });

router.get("/", (req, res, next) => {
  res.render("index");
});

router.post("/", upload.single("file-upload"), (req, res, next) => {
  console.log(req.file);
  res.render("index");
  console.log(`File saved to ${req.file.path}`);
});

module.exports = router;
