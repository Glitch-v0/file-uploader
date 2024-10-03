import express from "express";
import prisma from "../app.js";
import multer from "multer";
import { genPassword } from "../lib/passwordUtils.js";
import { body, validationResult } from "express-validator";
import { nameValidationRules } from "../lib/nameValidators.js";
import { verifyCallback } from "../config/passport.js"; // Adjust the path as necessary

import passport from "passport";

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
    if (errors && errors.length > 0) {
      res.render("index", { errors: errors, sentValues: req.body });
      return;
    }
    try {
      const hashPassword = genPassword(req.body.password);
      const newUser = await prisma.user.create({
        data: {
          email: req.body.email,
          password_hash: hashPassword,
          first_name: req.body.firstName,
          last_name: req.body.lastName,
        },
      });
      console.log(`New user created! ${newUser}`);
      res.render("index", { errors: null, sentValues: req.body });
    } catch (error) {
      console.log(error);
      res.render("index", { errors: [error], sentValues: req.body });
    }
  }
);

router.post("/login", async (req, res, next) => {
  console.log("Login attempt:", req.body); // Check incoming login data

  // Manually invoke your verifyCallback for testing
  await verifyCallback(req.body.email, req.body.password, (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.redirect("/login-failure");
    }
    req.logIn(user, (err) => {
      if (err) {
        return next(err);
      }
      return res.redirect("/cloud");
    });
  });
});

router.get("/login-failure", (req, res, next) => {
  res.render("index", {
    errors: [{ msg: "Invalid username or password" }],
    sentValues: null,
  });
});

router.get("/logout", (req, res, next) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

router.get("/cloud", async (req, res, next) => {
  if (req.isAuthenticated()) {
    res.render("cloud", { folders: null, currentFolder: null });
  } else {
    res.redirect("/");
  }
});
router.get("/cloud/:folderId", async (req, res, next) => {
  if (req.isAuthenticated()) {
    const inFolder = req.params.folderId;
    if (inFolder !== undefined && inFolder !== null) {
      console.log(`Searching prisma for folder id... ${inFolder}`);
      const currentFolder = await prisma.folder.findUnique({
        where: {
          id: inFolder,
        },
        include: {
          childFolders: true,
        },
      });
      res.render("cloud", {
        folders: currentFolder.childFolders,
        currentFolder: currentFolder.name,
      });
    } else {
      res.render("cloud", { folders: null, currentFolder: null });
    }
  } else {
    res.redirect("/");
  }
});

router.post("/cloud/:folderId?", async (req, res, next) => {
  const folderTags = req.body.tags.split(",").map((tag) => tag.trim());
  const newFolder = await prisma.user.update({
    where: {
      id: req.user.id,
    },
    data: {
      folders: {
        create: {
          name: req.body.name,
          parentFolderId: req.params.folderId || null,
          owner: {
            connect: {
              id: req.user.id,
            },
          },
          tags: {
            create: folderTags.map((tag) => ({
              name: tag,
              owner: {
                connect: {
                  id: req.user.id,
                },
              },
            })),
          },
        },
      },
    },
  });
  req.redirect(`/cloud/${newFolder.id}`);
});

router.post("/upload", upload.single("file-upload"), (req, res, next) => {
  console.log(req.file);
  console.log(`File saved to ${req.file.path}`);
  res.redirect("/cloud");
});

router.get("*", (req, res, next) => {
  res.redirect("/");
});
