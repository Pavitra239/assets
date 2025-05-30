import { body, param, validationResult } from "express-validator";
import {
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
} from "../errors/customErrors.js";
import { JOB_STATUS, JOB_TYPE } from "../utils/constants.js";
import mongoose from "mongoose";
import User from "../models/UserModel.js";
import Product from "../models/productModel.js";
const withValidationErrors = (validateValues) => {
  return [
    validateValues,
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const errorMessages = errors.array().map((error) => error.msg);

        if (errorMessages[0].startsWith("no job"))
          throw new NotFoundError(errorMessages);

        if (errorMessages[0].startsWith("no product"))
          throw new NotFoundError(errorMessages);

        if (errorMessages[0].startsWith("not authorized"))
          throw new UnauthorizedError(errorMessages);

        throw new BadRequestError(errorMessages);
      }
      next();
    },
  ];
};

export const validateRegisterInput = withValidationErrors([
  body("name").notEmpty().withMessage("Name is required"),
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Email is invalid")
    .custom(async (value) => {
      const user = await User.findOne({ email: value });
      if (user) throw new BadRequestError("Email already in use");
    }),
  body("password")
    .notEmpty()
    .withMessage("password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),
  body("location").notEmpty().withMessage("location is required"),
]);

export const validateLoginInput = withValidationErrors([
  body("email")
    .notEmpty()
    .withMessage("email is required")
    .isEmail()
    .withMessage("invalid email format"),
  body("password").notEmpty().withMessage("password is required"),
]);

export const validateUpdateUserInput = withValidationErrors([
  body("name").notEmpty().withMessage("Name is required"),
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("invalid Email Format")
    .custom(async (value, { req }) => {
      const user = await User.findOne({ email: value });
      if (user && user._id.toString() !== req.user.userId) {
        throw new BadRequestError("Email already exists");
      }
    }),
  body("location").notEmpty().withMessage("location is required"),
]);

// Products Validation

export const validateProductIdParam = withValidationErrors([
  param("id").custom(async (value, { req }) => {
    const isValid = await mongoose.Types.ObjectId.isValid(value);
    if (!isValid) throw new BadRequestError("Invalid MongoDB ID");
    const product = await Product.findById(value);
    if (!product) throw new NotFoundError(`no product with id ${value}`);
    const isAdmin = req.user.role === "admin";
    const isHead = req.user.role === "head";
    if (!isAdmin && !isHead)
      throw new UnauthorizedError("not authorized to access this route");
  }),
]);
