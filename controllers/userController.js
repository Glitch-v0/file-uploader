import prisma from "../app.js";
import { genPassword } from "../lib/passwordUtils.js";
import { validationResult } from "express-validator";
import { verifyCallback } from "../config/passport.js";

export const renderLogin = (req, res) => {
  res.render("index", { errors: null, sentValues: null });
};

export const registerUser = async (req, res, next) => {
  const errors = validationResult(req).array();
  if (errors.length > 0) {
    res.render("index", { errors: errors, sentValues: req.body });
    return;
  }

  try {
    const hashPassword = genPassword(req.body.password);
    const newUser = await prisma.user.create({
      data: {
        email: req.body.email,
        passwordHash: hashPassword,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
      },
    });
    console.log(`New user created! ${newUser}`);
    res.render("index", { errors: null, sentValues: req.body });
  } catch (error) {
    console.error(error);
    res.render("index", { errors: [error], sentValues: req.body });
  }
};

export const loginUser = async (req, res, next) => {
  await verifyCallback(req.body.email, req.body.password, (err, user) => {
    if (err) return next(err);
    if (!user) return res.redirect("/login-failure");

    req.logIn(user, (err) => {
      if (err) return next(err);
      res.redirect("/cloud");
    });
  });
};

export const logoutUser = (req, res, next) => {
  req.logout(function (err) {
    if (err) return next(err);
    res.redirect("/");
  });
};

export const renderLoginFailure = (req, res) => {
  res.render("index", {
    errors: [{ msg: "Invalid username or password" }],
    sentValues: null,
  });
};