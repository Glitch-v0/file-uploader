const router = require("express").Router();
const passport = require("passport");
const genPassword = require("../lib/passwordUtils").genPassword;
// const { body, validationResult } = require("express-validator");
// const { nameValidationRules } = require("../validators/nameValidators");
const multer = require("multer");
const upload = multer({ dest: "./uploads/" });

router.get("/", (req, res, next) => {
  res.render("index", { sentValues: null });
});

router.post("/", async (req, res, next) => {
  const hashPassword = genPassword(req.body.password);
  const newUser = await prisma.user.create({
    data: {
      username: req.body.username,
      password_hash: hashPassword,
      first_name: req.body.firstName,
      last_name: req.body.lastName,
    },
  });
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

module.exports = router;
