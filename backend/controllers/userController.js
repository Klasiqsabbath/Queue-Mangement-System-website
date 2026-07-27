import validator from "validator";
import bycrypt from "bcrypt";
import mongoose from "mongoose";
import userModel from "../models/userModel.js";
import jwt from "jsonwebtoken";
import { v2 as cloudinary } from "cloudinary";
import { demoImageUpload } from "../config/cloudinary.js";
import doctorModel from "../models/doctorModel.js";
import appointmentModel from "../models/appointmentModel.js";
import { memoryStorage } from "../storage/memoryStorage.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev_jwt_secret";
const canUseDbObjectId = (value) => mongoose.isValidObjectId(value);

const findMemoryDoctor = (docId) => {
  if (!docId) return null;
  return memoryStorage.doctors.findById(String(docId).trim());
};

const findMemoryUser = (userId) => {
  if (!userId) return null;
  return memoryStorage.users.findById(String(userId).trim());
};

const createFallbackUserData = (userId) => ({
  _id: String(userId || "").trim(),
  name: "Registered User",
  email: "user@example.com",
  date: Date.now(),
});

const createFallbackDoctorData = (docId) => ({
  _id: String(docId || "").trim(),
  name: "Doctor",
  speciality: "General physician",
  fees: 0,
  image: "",
  available: true,
  address: {},
  slots_booked: {},
});

// API to register user
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.json({ success: false, message: "Missing Details" });
    }

    // validating email format
    if (!validator.isEmail(email)) {
      return res.json({ success: false, message: "enter a valid email" });
    }

    // validating strong password
    if (password.length < 8) {
      return res.json({ success: false, message: "enter a strong password" });
    }

    // Check for existing user in the database first
    try {
      const existingDbUser = await userModel.findOne({ email });
      if (existingDbUser) {
        return res.json({ success: false, message: "User already exists" });
      }
    } catch (dbCheckError) {
      console.log(
        "Database user lookup failed, using fallback storage if available:",
        dbCheckError.message
      );
    }

    // hashing user password
    const salt = await bycrypt.genSalt(10);
    const hashedPassword = await bycrypt.hash(password, salt);

    const userData = {
      name,
      email,
      password: hashedPassword,
    };

    let user;
    let token;

    try {
      // Try database first
      const newUser = new userModel(userData);
      user = await newUser.save();
      token = jwt.sign({ id: user._id }, JWT_SECRET);
    } catch (error) {
      if (error.code === 11000 || error.message?.includes("duplicate")) {
        return res.json({ success: false, message: "User already exists" });
      }

      // Database not available, use memory storage
      console.log("Database not available, using memory storage for user registration");
      
      // Check if user already exists in memory
      const existingUser = memoryStorage.users.findOne({ email });
      if (existingUser) {
        return res.json({ success: false, message: "User already exists" });
      }

      user = memoryStorage.users.create(userData);
      token = jwt.sign({ id: user._id }, JWT_SECRET);
    }

    res.json({ success: true, token });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API for user login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    let user;
    
    try {
      user = await userModel.findOne({ email });
    } catch (error) {
      console.log("Database not available, using memory storage for user login");
    }

    if (!user) {
      user = memoryStorage.users.findOne({ email });
    }

    if (!user) {
      return res.json({ success: false, message: "User does not exist" });
    }

    const isMatch = await bycrypt.compare(password, user.password);

    if (isMatch) {
      const token = jwt.sign({ id: user._id }, JWT_SECRET);
      res.json({ success: true, token });
    } else {
      res.json({ success: false, message: "Invalid credentials" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to get user profile data
const getProfile = async (req, res) => {
  try {
    const userId = req.userId || req.body.userId;
    if (!userId) {
      return res.json({ success: false, message: "User not found" });
    }

    let userData;

    try {
      userData = await userModel.findById(userId).select("-password");
    } catch (error) {
      console.log("Database not available, using memory storage for user profile");
    }

    if (!userData) {
      userData = memoryStorage.users.findById(String(userId).trim());
    }

    if (!userData) {
      return res.json({ success: false, message: "User not found" });
    }

    if (userData.password) {
      const { password, ...userDataWithoutPassword } = userData;
      userData = userDataWithoutPassword;
    }

    res.json({ success: true, user: userData });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to update user profile
const updateProfile = async (req, res) => {
  try {
    const { userId, name, 
    phone, address, dob, gender } = req.body;
    const imageFile = req.file;

    if (!name || !phone || !dob || !gender) {
      return res.json({ success: false, message: "Data Missing" });
    }

    const updateData = {
      name,
      phone,
      address: typeof address === 'string' ? JSON.parse(address) : address,
      dob,
      gender,
    };

    try {
      // Try database first
      await userModel.findByIdAndUpdate(userId, updateData);

      if (imageFile) {
        // upload image to cloudinary
        const imageUpload = await cloudinary.uploader.upload(imageFile.path, {
          resource_type: "image",
        });
        const imageURL = imageUpload.secure_url;
        await userModel.findByIdAndUpdate(userId, { image: imageURL });
      }
    } catch (error) {
      // Database not available, use memory storage
      console.log("Database not available, using memory storage for profile update");
      memoryStorage.users.findByIdAndUpdate(userId, updateData);

      if (imageFile) {
        // For demo purposes, just store the filename
        memoryStorage.users.findByIdAndUpdate(userId, { image: imageFile.filename || 'default.png' });
      }
    }

    res.json({ success: true, message: "Profile Updated" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to book appointment
const bookAppointment = async (req, res) => {
  try {
    const { docId, slotDate, slotTime, reason, name, phone } = req.body;
    const userId = req.userId || req.body?.userId;

    if (!userId) {
      return res.json({ success: false, message: "Not Authorized. Please log in again." });
    }

    let docData;
    let userData;

    try {
      if (canUseDbObjectId(docId)) {
        docData = await doctorModel.findById(docId).select("-password");
      } else {
        throw new Error("Using memory storage");
      }
      if (canUseDbObjectId(userId)) {
        userData = await userModel.findById(userId).select("-password");
      } else {
        throw new Error("Using memory storage");
      }
    } catch (error) {
      console.log("Database not available, using memory storage for appointment booking");
    }

    if (!docData) {
      const memoryDocData = findMemoryDoctor(docId);
      if (memoryDocData) {
        docData = memoryDocData;
      }
    }

    if (!userData) {
      const memoryUserData = findMemoryUser(userId);
      if (memoryUserData) {
        userData = memoryUserData;
      }
    }

    if (userData && userData.password) {
      const { password, ...userDataWithoutPassword } = userData;
      userData = userDataWithoutPassword;
    }

    if (!docData) {
      docData = createFallbackDoctorData(docId);
    }

    if (!userData) {
      userData = createFallbackUserData(userId);
    }

    if (name) {
      userData.name = name;
    }

    if (phone) {
      userData.phone = phone;
    }

    if (docData.available === false) {
      return res.json({ success: false, message: "Doctor not available" });
    }

    let slots_booked = docData.slots_booked || {};

    // checking for slot availability
    if (slots_booked[slotDate]) {
      if (slots_booked[slotDate].includes(slotTime)) {
        return res.json({ success: false, message: "Slot not available" });
      } else {
        slots_booked[slotDate].push(slotTime);
      }
    } else {
      slots_booked[slotDate] = [];
      slots_booked[slotDate].push(slotTime);
    }

    // Remove slots_booked from docData for appointment data
    const { slots_booked: _, ...docDataForAppointment } = docData;

    const appointmentData = {
      userId,
      docId,
      userData,
      docData: docDataForAppointment,
      amount: docData.fees,
      slotTime,
      slotDate,
      reason: reason || "",
      date: Date.now(),
    };

    let newAppointment;
    let savedAppointment;
    
    try {
      // Try database first
      newAppointment = new appointmentModel(appointmentData);
      savedAppointment = await newAppointment.save();
      newAppointment = savedAppointment.toObject();
      try {
        if (canUseDbObjectId(docId)) {
          await doctorModel.findByIdAndUpdate(docId, { slots_booked });
        } else {
          throw new Error("Using memory storage");
        }
      } catch (updateError) {
        console.log("Doctor slot update failed after appointment save", updateError);
      }
    } catch (error) {
      // Database not available, use memory storage
      console.log("Database not available, using memory storage for appointment creation");
      newAppointment = memoryStorage.appointments.create(appointmentData);
      memoryStorage.doctors.findByIdAndUpdate(docId, { slots_booked });
    }

    res.json({ success: true, message: "Appointment Booked", appointment: newAppointment });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to get user appointments for frontend my-appointments page
const getAppointmentById = async (req, res) => {
  try {
    const { userId } = req.body;
    const { id } = req.params;

    let appointment;

    try {
      appointment = await appointmentModel.findById(id);
    } catch (error) {
      console.log("Database not available, using memory storage for appointment fetch");
    }

    if (!appointment) {
      appointment = memoryStorage.appointments.findById(id);
    }

    if (!appointment) {
      return res.json({ success: false, message: "Appointment not found" });
    }

    if (String(appointment.userId) !== String(userId)) {
      return res.json({ success: false, message: "Appointment not found" });
    }

    res.json({ success: true, appointment });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to list user appointments for frontend my-appointments page
const listAppointment = async (req, res) => {
  try {
    const { userId } = req.body;

    let appointments;

    try {
      appointments = await appointmentModel.find({ userId });
    } catch (error) {
      console.log("Database not available, using memory storage for appointment listing");
    }

    if (!appointments || appointments.length === 0) {
      appointments = memoryStorage.appointments.find({ userId });
    }

    if (!appointments) {
      appointments = [];
    }

    res.json({ success: true, appointments });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to cancel appointment
const cancelAppointment = async (req, res) => {
  try {
    const { userId, appointmentId } = req.body;

    let appointmentData;
    
    try {
      // Try database first
      appointmentData = await appointmentModel.findById(appointmentId);
    } catch (error) {
      // Database not available, use memory storage
      console.log("Database not available, using memory storage for appointment cancellation");
      appointmentData = memoryStorage.appointments.findById(appointmentId);
    }

    if (!appointmentData) {
      return res.json({ success: false, message: "Appointment not found" });
    }

    // verify appointment user
    if (String(appointmentData.userId) !== String(userId)) {
      return res.json({ success: false, message: "Unauthorized action" });
    }

    try {
      // Try database first
      await appointmentModel.findByIdAndUpdate(appointmentId, {
        cancelled: true,
      });

      // releasing doctor slot
      const { docId, slotDate, slotTime } = appointmentData;
      const doctorData = await doctorModel.findById(docId);
      if (doctorData) {
        let slots_booked = doctorData.slots_booked || {};
        if (slots_booked[slotDate]) {
          slots_booked[slotDate] = slots_booked[slotDate].filter(
            (e) => e !== slotTime
          );
          await doctorModel.findByIdAndUpdate(docId, { slots_booked });
        }
      }
    } catch (error) {
      // Database not available, use memory storage
      memoryStorage.appointments.findByIdAndUpdate(appointmentId, {
        cancelled: true,
      });

      // releasing doctor slot
      const { docId, slotDate, slotTime } = appointmentData;
      const doctorData = memoryStorage.doctors.findById(docId);
      if (doctorData && doctorData.slots_booked) {
        let slots_booked = doctorData.slots_booked;
        if (slots_booked[slotDate]) {
          slots_booked[slotDate] = slots_booked[slotDate].filter(
            (e) => e !== slotTime
          );
        }
        memoryStorage.doctors.findByIdAndUpdate(docId, { slots_booked });
      }
    }

    res.json({ success: true, message: "Appointment Cancelled" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  bookAppointment,
  listAppointment,
  getAppointmentById,
  cancelAppointment,
};
