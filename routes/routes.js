import express from "express";
import { isAuthenticated } from "../middleware/authRoute.js";
import { userController } from "../controllers/userController.js";
import { storageController } from "../controllers/storageController.js";
import asyncHandler from "express-async-handler";

const router = express.Router();

router.use(isAuthenticated); // Protect all routes below

router.get("/search", (req, res, next) => {
  res.render("search", {
    errors: null,
    tags: null,
    folders: null,
    files: null,
  });
});

router.post("/search", asyncHandler(storageController.searchAll));

router.use((err, req, res, next) => {
  console.error(err.stack);
  res
    .status(500)
    .render("error", { errors: [{ msg: err }] || "Internal Server Error" });
});

router.get("*", (req, res, next) => {
  res.redirect("/");
});

export default router;
