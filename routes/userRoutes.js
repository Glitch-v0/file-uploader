import express from "express";
import { userController } from "../controllers/userController.js";
import expressAsyncHandler from "express-async-handler";

const userRouter = express.Router();

// User routes
userRouter.get("/", expressAsyncHandler(userController.renderLogin));
userRouter.post("/", expressAsyncHandler(userController.registerUser));
userRouter.post("/login", expressAsyncHandler(userController.loginUser));
userRouter.get(
  "/login-failure",
  expressAsyncHandler(userController.renderLoginFailure),
);
userRouter.get("/logout", expressAsyncHandler(userController.logoutUser));

export default userRouter;
