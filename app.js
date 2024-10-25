import express from "express";
import session from "express-session";
import { PrismaSessionStore } from "@quixo3/prisma-session-store";
import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import passport from "passport";
import otherRoutes from "./routes/otherRoutes.js";
import tagRouter from "./routes/tagRoutes.js";
import fileRouter from "./routes/fileRoutes.js";
import folderRouter from "./routes/folderRoutes.js";
import userRouter from "./routes/userRoutes.js";
import { isAuthenticated } from "./middleware/authRoute.js";
import path from "node:path";
import { fileURLToPath } from "url";
import "./config/passport.js";
import dotenv from "dotenv";
dotenv.config();

const app = express();

app.use(express.json());

// set up view engine
const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory
app.set("views", path.join(__dirname, "./views"));
app.set("view engine", "ejs");

// set up middleware to parse form data
app.use(express.urlencoded({ extended: true }));

// serve static files
const assetsPath = path.join(__dirname, "./public");
app.use(express.static(assetsPath));

export const prisma = new PrismaClient();
// Session setup
app.use(
  session({
    store: new PrismaSessionStore(prisma, {
      checkPeriod: 2 * 60 * 1000, //ms
      dbRecordIdIsSessionId: true,
      dbRecordIdFunction: undefined,
    }),
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
  }),
);

// Passport setup
app.use(passport.initialize());
app.use(passport.session());

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
export const supabase = createClient(supabaseUrl, supabaseKey);

app.use([
  userRouter,
  isAuthenticated,
  folderRouter,
  fileRouter,
  tagRouter,
  otherRoutes,
]);

app.listen(3000, () => console.log("Server running on port 3000"));

export default prisma;
