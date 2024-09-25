const router = require("express").Router();
const passport = require("passport");
const genPassword = require("../lib/passwordUtils").genPassword;
// const { body, validationResult } = require("express-validator");
// const { nameValidationRules } = require("../validators/nameValidators");

router.get("/", (req, res, next) => {
  res.render("index");
});

module.exports = router;
