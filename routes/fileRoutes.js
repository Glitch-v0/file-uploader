import express from "express";
import { storageController } from "../controllers/storageController.js";
import multer from "multer";
import asyncHandler from "express-async-handler";

const fileRouter = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

/* Upload Files */
fileRouter.post(
  // to root directory
  "/cloud/upload",
  upload.single("file-upload"),
  asyncHandler(storageController.uploadFile),
);
fileRouter.post(
  // to a parent folder
  "/cloud/:folderId?/upload",
  upload.single("file-upload"),
  asyncHandler(storageController.uploadFile),
);

/* Delete Files */
fileRouter.get(
  "/cloud/:fileId/deleteFile",
  asyncHandler(storageController.deleteFile),
);

/* Update Files */
fileRouter.get(
  "/cloud/:fileId?/updateFile",
  asyncHandler(storageController.getFileUpdateForm),
);
fileRouter.post(
  "/cloud/:fileId?/updateFile",
  asyncHandler(storageController.updateFile),
);

/* View Files */
fileRouter.get(
  "/cloud/:fileId/download",
  asyncHandler(storageController.downloadFile),
);
fileRouter.get(
  "/cloud/:folderId?/:fileId/view",
  asyncHandler(storageController.viewFile),
);

export default fileRouter; // Export
