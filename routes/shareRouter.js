import express from "express";
import asyncHandler from "express-async-handler";
import { shareController } from "../controllers/shareController.js";
import { storageController } from "../controllers/storageController.js";

const shareRouter = express.Router();

// Share Form
shareRouter.get(
  "/share/folder/:folderId",
  asyncHandler(shareController.renderShareForm),
);

// Create Share Link
shareRouter.post(
  "/share/folder/:folderId",
  asyncHandler(shareController.renderShareLinkForm),
);

// Share Links
shareRouter.get(
  "/share/link/:folderId",
  asyncHandler(shareController.renderShareLinkForm),
);

// Download Shared File
shareRouter.get(
  "/sharedFile/:fileId/download",
  asyncHandler(storageController.downloadFile),
);

// View shared items
shareRouter.get(
  "/sharedFile/:fileId",
  asyncHandler(shareController.viewSharedFile),
);
shareRouter.get(
  "/sharedFolder/:folderId",
  asyncHandler(shareController.viewSharedFolder),
);

export default shareRouter;
