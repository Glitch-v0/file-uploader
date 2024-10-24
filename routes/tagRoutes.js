import express from "express";
import { storageController } from "../controllers/storageController.js";
import asyncHandler from "express-async-handler";

const tagRouter = express.Router();

tagRouter.get("/tag/:tagId", asyncHandler(storageController.viewTags));
tagRouter.get(
  "/cloud/:tagId/createTag",
  asyncHandler(storageController.createTag),
);
tagRouter.get(
  "/cloud/:tagId/updateTag",
  asyncHandler(storageController.getTagUpdateForm),
);
tagRouter.post(
  "/cloud/:tagId/updateTag",
  asyncHandler(storageController.updateTag),
);
tagRouter.get(
  "/cloud/:tagId/deleteTag",
  asyncHandler(storageController.deleteTag),
);

export default tagRouter;
