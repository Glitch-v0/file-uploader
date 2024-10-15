import express from "express";
import { isAuthenticated } from "../middleware/authRoute.js";
import {
  renderLogin,
  registerUser,
  loginUser,
  logoutUser,
  renderLoginFailure,
} from "../controllers/userController.js";
import {
  getRootDirectoryData,
  getFolderData,
  createFolder,
  uploadFile,
  viewFile,
  downloadFile,
} from "../controllers/cloudController.js";
import multer from "multer";
import asyncHandler from "express-async-handler";

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

// User routes
router.get("/", renderLogin);
router.post("/", registerUser);
router.post("/login", loginUser);
router.get("/login-failure", renderLoginFailure);
router.get("/logout", logoutUser);

router.use(isAuthenticated); // Protect all routes below

// Cloud routes
router.get("/cloud", getRootDirectoryData);
router.get("/cloud/:folderId", asyncHandler(getFolderData));
router.post(
  // upload to root directory
  "/cloud/upload",
  upload.single("file-upload"),
  asyncHandler(uploadFile),
);
router.post(
  // upload to a parent folder
  "/cloud/:folderId?/upload",
  upload.single("file-upload"),
  asyncHandler(uploadFile),
);
router.post("/cloud/:folderId?", asyncHandler(createFolder));
router.get("/cloud/:fileId/download", asyncHandler(downloadFile));
router.get("/cloud/:folderId?/:fileId/view", asyncHandler(viewFile));

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
