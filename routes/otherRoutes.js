import express from "express";
import { storageController } from "../controllers/storageController.js";
import asyncHandler from "express-async-handler";

const otherRoutes = express.Router();

otherRoutes.get("/search", (req, res, next) => {
  res.render("search", {
    errors: null,
    tags: null,
    folders: null,
    files: null,
    searchMade: false,
  });
});

otherRoutes.post("/search", asyncHandler(storageController.searchAll));

otherRoutes.use((err, req, res, next) => {
  console.error(err.stack);
  res
    .status(500)
    .render("error", { errors: [{ msg: err }] || "Internal Server Error" });
});

otherRoutes.get("*", (req, res, next) => {
  res.redirect("/");
});

export default otherRoutes;
