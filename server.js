import "express-async-errors"; // avoids app crashing for async errors
import * as dotenv from "dotenv";
dotenv.config();
import express from "express";
import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { authenticateUser } from "./middlewares/authMiddleware.js";
// Routes
import userRouter from "./routes/userRoutes.js";
import authRouter from "./routes/authRoutes.js";
import productRouter from "./routes/productRoutes.js";
// middlewares
import errorHandlerMiddleware from "./middlewares/errorHandlerMiddleware.js";

//public
import { dirname } from "path";
import { fileURLToPath } from "url";
import path from "path";

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_SECRET,
});

const app = express();

const __dirname = dirname(fileURLToPath(import.meta.url));

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use(express.static(path.resolve(__dirname, "public")));
app.use(express.json());
app.use(cookieParser());

// Products Routes
app.use("/api/v1/products", authenticateUser, productRouter);

// User Routes
app.use("/api/v1/users", authenticateUser, userRouter);

// Auth Routes
app.use("/api/v1/auth", authRouter);

app.get("*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "public", "index.html"));
});

// 404
app.use("*", (req, res) => {
  res.status(404).json({
    message: "Page not found",
  });
});

app.use(errorHandlerMiddleware);

const PORT = process.env.PORT || 5100;
try {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");
  app.listen(PORT, () => {
    console.log("Server started on port 5100");
  });
} catch (error) {
  console.log(error);
  process.exit(1);
}
