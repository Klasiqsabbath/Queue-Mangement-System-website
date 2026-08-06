import express from "express";
import {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  bookAppointment,
  listAppointment,
  getAppointmentById,
  cancelAppointment,
  sendConfirmationEmail,
} from "../controllers/userController.js";
import authUser from "../middlewares/authUser.js";
import upload from "../middlewares/multer.js";

const userRouter = express.Router();

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);

userRouter.get("/get-profile", authUser, getProfile);
userRouter.post(
  "/update-profile",
  upload.single("image"),
  authUser,
  updateProfile
);
userRouter.post("/book-appointment", authUser, bookAppointment);
userRouter.get("/appointments", authUser, listAppointment);
userRouter.get("/appointment/:id", authUser, getAppointmentById);
userRouter.post("/cancel-appointment", authUser, cancelAppointment);
userRouter.post("/send-confirmation-email", authUser, sendConfirmationEmail);

export default userRouter;
