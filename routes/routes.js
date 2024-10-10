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
  getCloudData,
  getFolderData,
  createFolder,
  uploadFile,
  viewFile,
} from "../controllers/cloudController.js";
import multer from "multer";
import tryCatch from "express-async-handler";

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

// User routes
router.get("/", renderLogin);
router.post("/", registerUser);
router.post("/login", loginUser);
router.get("/login-failure", renderLoginFailure);
router.get("/logout", logoutUser);

// Cloud routes
router.get("/cloud", isAuthenticated, getCloudData);
router.get("/cloud/:folderId", isAuthenticated, tryCatch(getFolderData));
router.post(
  "/cloud//upload",
  isAuthenticated,
  upload.single("file-upload"),
  tryCatch(uploadFile),
);
router.post(
  "/cloud/:folderId?/upload",
  isAuthenticated,
  upload.single("file-upload"),
  tryCatch(uploadFile),
);
router.post("/cloud/:folderId?", isAuthenticated, tryCatch(createFolder));
router.get("/file/:folderId?/:fileId", isAuthenticated, viewFile);

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
