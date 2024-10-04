import express from "express";
import prisma from "../app.js";
import multer from "multer";
import { genPassword } from "../lib/passwordUtils.js";
import { body, validationResult } from "express-validator";
import tryCatch from "express-async-handler";
import { nameValidationRules } from "../lib/nameValidators.js";
import { verifyCallback } from "../config/passport.js"; // Adjust the path as necessary
import { isAuthenticated } from "../middleware/authRoute.js";
import { tagQueries, folderQueries } from "../queries/queries.js";

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

router.get("/cloud", isAuthenticated, async (req, res, next) => {
  const currentFolders = await folderQueries.getOrphanFolders();
  console.log({ currentFolders });
  res.render("cloud", {
    errors: null,
    folders: currentFolders,
    currentFolder: null,
    currentURL: req.originalUrl,
  });
});

router.get(
  "/cloud/:folderId",
  isAuthenticated,
  tryCatch(async (req, res, next) => {
    const folderParameter = req.params.folderId;
    const parentFolder = await folderQueries.getFolder(folderParameter);
    if (!parentFolder) {
      res.redirect("/cloud");
    }
    const childFolders = await folderQueries.getFolderChildren(parentFolder.id);
    res.render("cloud", {
      errors: null,
      folders: childFolders,
      currentFolder: parentFolder.name,
      currentURL: req.originalUrl,
    });
  })
);

router.post(
  "/cloud/:folderId?",
  isAuthenticated,
  tryCatch(async (req, res, next) => {
    // Create new folder
    const currentParentFolder = req.params.folderId;
    const newFolder = await folderQueries.createFolder(
      req.body.name,
      req.user.id
    );
    if (currentParentFolder) {
      console.log(
        `Assigning parent folder ${currentParentFolder} to ${newFolder.id}`
      );
      const test = await folderQueries.assignParentToFolder(
        newFolder.id,
        currentParentFolder
      );
      console.log(test);
    }

    // Tags
    const folderTags = req.body.tags.split(",").map((tag) => tag.trim());

    // Check each tag before creating DB entry
    let tagsToCreate = [];
    folderTags.forEach((tag) => {
      const tagExists = tagQueries.checkIfTagExists(tag, req.user.id);
      if (!tagExists) {
        tagsToCreate.push(tag);
      }
    });

    // Create tags in DB
    if (tagsToCreate.length > 0) {
      tagQueries.createTags(tagsToCreate, req.user.id);
    }

    // Connect tags to folder
    tagQueries.connectTagsToFolder(folderTags, req.user.id, newFolder.id);
    // console.log({ currentParentFolder, newFolder });
    res.redirect(`/cloud/${newFolder.id}`);
  })
);

router.post(
  "/upload",
  isAuthenticated,
  upload.single("file-upload"),
  (req, res, next) => {
    console.log(req.file);
    console.log(`File saved to ${req.file.path}`);
    res.redirect("/cloud");
  }
);

router.use((err, req, res, next) => {
  console.error(err.stack); // Log the error stack for debugging
  res.status(500).render("error", { errors: [err] || "Internal Server Error" });
});

router.get("*", (req, res, next) => {
  res.redirect("/");
});
