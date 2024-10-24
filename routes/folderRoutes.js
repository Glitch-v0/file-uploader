import express from "express";
import { storageController } from "../controllers/storageController.js";
import asyncHandler from "express-async-handler";

const folderRouter = express.Router();

/* Create Folders */
folderRouter.post(
  "/cloud/:folderId?",
  asyncHandler(storageController.createFolder),
);

/* Read Folders */
folderRouter.get("/cloud", storageController.getRootDirectoryData);

folderRouter.get(
  "/cloud/:folderId",
  asyncHandler(storageController.getFolderData),
);

// Updating Folders
folderRouter.get(
  "/cloud/:folderId?/updateFolder",
  asyncHandler(storageController.getFolderUpdateForm),
);
folderRouter.post(
  "/cloud/:folderId?/:fileId?/updateFolder",
  asyncHandler(storageController.updateFolder),
);

/* Delete Folders */
folderRouter.get(
  "/cloud/:folderId?/deleteFolder",
  asyncHandler(storageController.deleteFolder),
);

export default folderRouter;
