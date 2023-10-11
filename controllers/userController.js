import { StatusCodes } from "http-status-codes";
import User from "../models/UserModel.js";
import Product from "../models/productModel.js";
import { v2 as cloudinary } from "cloudinary";
import { promises as fs } from "fs";
import { USER_DEPARTMENTS } from "../utils/constants.js";
export const getCurrentUser = async (req, res) => {
  const user = await User.findOne({ _id: req.user.userId });
  const userWithoutPassword = user.toJSON();
  res.status(StatusCodes.OK).json({
    user: userWithoutPassword,
  });
};

export const getApplicationStats = async (req, res) => {
  const users = await User.countDocuments();
  const queryObject = {};
  if (req.user.role === "head") {
    queryObject.department = req.user.department;
  }
  const products = await Product.countDocuments(queryObject);
  res.status(StatusCodes.OK).json({
    users,
    products,
  });
};

export const getUsersList = async (req, res) => {
  const users = await User.find({}).sort("name");
  res.status(StatusCodes.OK).json({
    users,
  });
};

export const getDepartmentList = async (req, res) => {
  let departments = [req.user.department];
  if (req.user.role === "admin") {
    departments = Object.values(USER_DEPARTMENTS);
  }
  res.status(StatusCodes.OK).json({ departments });
};

export const updateUser = async (req, res) => {
  const newUser = { ...req.body };
  delete newUser.password;
  if (req.file) {
    const response = await cloudinary.uploader.upload(req.file.path);
    await fs.unlink(req.file.path);
    newUser.avatar = response.secure_url;
    newUser.avatarPublicId = response.public_id;
  }

  const updatedUser = await User.findByIdAndUpdate(req.user.userId, newUser);

  if (req.file && updatedUser.avatarPublicId) {
    await cloudinary.uploader.destroy(updatedUser.avatarPublicId);
  }

  res.status(StatusCodes.OK).json({
    msg: "updated user",
  });
};
