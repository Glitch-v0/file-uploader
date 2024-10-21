import express from "express";
import { isAuthenticated } from "../middleware/authRoute.js";
import { userController } from "../controllers/userController.js";
import { storageController } from "../controllers/storageController.js";
import multer from "multer";
import asyncHandler from "express-async-handler";

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

// User routes
router.get("/", userController.renderLogin);
router.post("/", userController.registerUser);
router.post("/login", userController.loginUser);
router.get("/login-failure", userController.renderLoginFailure);
router.get("/logout", userController.logoutUser);

router.use(isAuthenticated); // Protect all routes below

// Cloud routes
router.get("/cloud", storageController.getRootDirectoryData);
router.get("/cloud/:folderId", asyncHandler(storageController.getFolderData));
router.post(
  // upload to root directory
  "/cloud/upload",
  upload.single("file-upload"),
  asyncHandler(storageController.uploadFile),
);
router.post(
  // upload to a parent folder
  "/cloud/:folderId?/upload",
  upload.single("file-upload"),
  asyncHandler(storageController.uploadFile),
);
router.get(
  // delete a file
  "/cloud/:fileId/deleteFile",
  asyncHandler(storageController.deleteFile),
);
router.get(
  // delete a folder
  "/cloud/:folderId?/deleteFolder",
  asyncHandler(storageController.deleteFolder),
);

router.post("/cloud/:folderId?", asyncHandler(storageController.createFolder));

// Updating Folders
router.get(
  "/cloud/:folderId?/updateFolder",
  asyncHandler(storageController.getFolderUpdateForm),
);
router.post(
  "/cloud/:folderId?/:fileId?/updateFolder",
  asyncHandler(storageController.updateFolder),
);

// Updating Files
router.get(
  "/cloud/:fileId?/updateFile",
  asyncHandler(storageController.getFileUpdateForm),
);
router.post(
  "/cloud/:fileId?/updateFile",
  asyncHandler(storageController.updateFile),
);

router.get(
  "/cloud/:fileId/download",
  asyncHandler(storageController.downloadFile),
);
router.get(
  "/cloud/:folderId?/:fileId/view",
  asyncHandler(storageController.viewFile),
);

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
