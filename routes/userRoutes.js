import express from "express";
import { userController } from "../controllers/userController.js";

const userRouter = express.Router();

// User routes
userRouter.get("/", userController.renderLogin);
userRouter.post("/", userController.registerUser);
userRouter.post("/login", userController.loginUser);
userRouter.get("/login-failure", userController.renderLoginFailure);
userRouter.get("/logout", userController.logoutUser);

export default userRouter;
