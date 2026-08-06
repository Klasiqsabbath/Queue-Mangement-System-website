import validator from "validator";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";
import doctorModel from "../models/doctorModel.js";
import jwt from "jsonwebtoken";
import appointmentModel from "../models/appointmentModel.js";
import userModel from "../models/userModel.js";
import { memoryStorage } from "../storage/memoryStorage.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev_jwt_secret";
const canUseDbObjectId = (value) => mongoose.isValidObjectId(value);

// API for adding doctor
const addDoctor = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      speciality,
      degree,
      experience,
      about,
      fees,
      address,
    } = req.body;
    const imageFile = req.file;

    // checking for all data to add doctor
    if (
      !name ||
      !email ||
      !password ||
      !speciality ||
      !degree ||
      !experience ||
      !about ||
      !fees ||
      !address
    ) {
      return res.json({ success: false, message: "Missing Details" });
    }

    // validating email format
    if (!validator.isEmail(email)) {
      return res.json({
        success: false,
        message: "Please enter a valid email",
      });
    }

    // validating strong password
    if (password.length < 8) {
      return res.json({
        success: false,
        message: "Please enter a strong password",
      });
    }

    // hashing doctor password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // upload image to cloudinary
    const imageUpload = await cloudinary.uploader.upload(imageFile.path, {
      resource_type: "image",
    });
    const imageUrl = imageUpload.secure_url;

    const doctorData = {
      name,
      email,
      image: imageUrl,
      password: hashedPassword,
      speciality,
      degree,
      experience,
      about,
      fees,
      address: JSON.parse(address),
      date: Date.now(),
    };

    const newDoctor = new doctorModel(doctorData);
    await newDoctor.save();

    res.json({ success: true, message: "Doctor Added" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API for admin Login
const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      email === process.env.ADMIN_EMAIL &&
      password === process.env.ADMIN_PASSWORD
    ) {
      const token = jwt.sign(
        { admin: true, email: process.env.ADMIN_EMAIL },
        JWT_SECRET,
        { expiresIn: "8h" }
      );
      res.json({ success: true, token });
    } else {
      res.json({ success: false, message: "Invalid credentials" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to get all doctors list for admin panel
const allDoctors = async (req, res) => {
  try {
    let doctors = await doctorModel.find({}).select("-password");
    if (!doctors || doctors.length === 0) {
      doctors = memoryStorage.doctors.find().map((doctor) => {
        const { password, ...doctorWithoutPassword } = doctor;
        return doctorWithoutPassword;
      });
    }
    res.json({ success: true, doctors });
  } catch (error) {
    console.log(error);
    let doctors = memoryStorage.doctors.find().map((doctor) => {
      const { password, ...doctorWithoutPassword } = doctor;
      return doctorWithoutPassword;
    });
    res.json({ success: true, doctors });
  }
};

// API to get all appointments list
const appointmentsAdmin = async (req, res) => {
  try {
    let appointments;

    try {
      appointments = await appointmentModel.find({});
    } catch (error) {
      console.log("Database not available, using memory storage for admin appointment list");
      appointments = memoryStorage.appointments.find({});
    }

    if (!appointments || appointments.length === 0) {
      appointments = memoryStorage.appointments.find({});
    }

    res.json({ success: true, appointments });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const updateDoctorSlot = async (docId, slotDate, slotTime, action = "add") => {
  if (!docId || !slotDate || !slotTime) return;

  try {
    const doctorData = await doctorModel.findById(docId);
    if (doctorData && doctorData.slots_booked) {
      const slots_booked = { ...(doctorData.slots_booked || {}) };
      if (!slots_booked[slotDate]) {
        slots_booked[slotDate] = [];
      }

      if (action === "remove") {
        slots_booked[slotDate] = (slots_booked[slotDate] || []).filter(
          (e) => e !== slotTime
        );
      } else if (!slots_booked[slotDate].includes(slotTime)) {
        slots_booked[slotDate].push(slotTime);
      }

      await doctorModel.findByIdAndUpdate(docId, { slots_booked });
    }
  } catch (error) {
    const doctorData = memoryStorage.doctors.findById(docId);
    if (doctorData && doctorData.slots_booked) {
      const slots_booked = { ...(doctorData.slots_booked || {}) };
      if (!slots_booked[slotDate]) {
        slots_booked[slotDate] = [];
      }

      if (action === "remove") {
        slots_booked[slotDate] = (slots_booked[slotDate] || []).filter(
          (e) => e !== slotTime
        );
      } else if (!slots_booked[slotDate].includes(slotTime)) {
        slots_booked[slotDate].push(slotTime);
      }

      memoryStorage.doctors.findByIdAndUpdate(docId, { slots_booked });
    }
  }
};

// API for appointment cancellation
const appointmentCancel = async (req, res) => {
  try {
    const { appointmentId } = req.body;

    let appointmentData = null;

    try {
      appointmentData = await appointmentModel.findById(appointmentId);
    } catch (error) {
      appointmentData = memoryStorage.appointments.findById(appointmentId);
    }

    if (!appointmentData) {
      appointmentData = memoryStorage.appointments.findById(appointmentId);
    }

    if (!appointmentData) {
      return res.json({ success: false, message: "Appointment not found" });
    }

    if (appointmentData.cancelled) {
      return res.json({ success: true, message: "Appointment already cancelled" });
    }

    try {
      await appointmentModel.findByIdAndUpdate(appointmentId, {
        cancelled: true,
      });
    } catch (error) {
      memoryStorage.appointments.findByIdAndUpdate(appointmentId, {
        cancelled: true,
      });
    }

    const { docId, slotDate, slotTime } = appointmentData;

    try {
      const doctorData = await doctorModel.findById(docId);
      if (doctorData && doctorData.slots_booked) {
        let slots_booked = doctorData.slots_booked;
        if (slots_booked[slotDate]) {
          slots_booked[slotDate] = slots_booked[slotDate].filter(
            (e) => e !== slotTime
          );
        }
        await doctorModel.findByIdAndUpdate(docId, { slots_booked });
      }
    } catch (error) {
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

// API to update appointment data from admin panel
const updateAppointment = async (req, res) => {
  try {
    const {
      appointmentId,
      slotDate,
      slotTime,
      reason,
      amount,
      cancelled,
      isCompleted,
      docId,
      userId,
      userData,
      docData,
    } = req.body;

    let appointmentData = null;

    try {
      appointmentData = await appointmentModel.findById(appointmentId);
    } catch (error) {
      appointmentData = memoryStorage.appointments.findById(appointmentId);
    }

    if (!appointmentData) {
      return res.json({ success: false, message: "Appointment not found" });
    }

    const updateData = {};
    if (slotDate !== undefined) updateData.slotDate = slotDate;
    if (slotTime !== undefined) updateData.slotTime = slotTime;
    if (reason !== undefined) updateData.reason = reason;
    if (amount !== undefined) updateData.amount = amount;
    if (cancelled !== undefined) updateData.cancelled = Boolean(cancelled);
    if (isCompleted !== undefined) updateData.isCompleted = Boolean(isCompleted);
    if (docId !== undefined) updateData.docId = docId;
    if (userId !== undefined) updateData.userId = userId;
    if (userData !== undefined) updateData.userData = userData;
    if (docData !== undefined) updateData.docData = docData;

    const previousSlotDate = appointmentData.slotDate;
    const previousSlotTime = appointmentData.slotTime;
    const previousCancelled = Boolean(appointmentData.cancelled);
    const nextCancelled = Boolean(updateData.cancelled ?? previousCancelled);

    try {
      if (canUseDbObjectId(appointmentId)) {
        await appointmentModel.findByIdAndUpdate(appointmentId, updateData);
      } else {
        throw new Error("Using memory storage");
      }
    } catch (error) {
      memoryStorage.appointments.findByIdAndUpdate(appointmentId, updateData);
    }

    if (previousCancelled && !nextCancelled) {
      await updateDoctorSlot(appointmentData.docId, previousSlotDate, previousSlotTime, "add");
    } else if (!previousCancelled && nextCancelled) {
      await updateDoctorSlot(appointmentData.docId, previousSlotDate, previousSlotTime, "remove");
    } else if (previousSlotDate !== updateData.slotDate || previousSlotTime !== updateData.slotTime) {
      await updateDoctorSlot(appointmentData.docId, previousSlotDate, previousSlotTime, "remove");
      if (!nextCancelled && updateData.slotDate && updateData.slotTime) {
        await updateDoctorSlot(appointmentData.docId, updateData.slotDate, updateData.slotTime, "add");
      }
    }

    res.json({ success: true, message: "Appointment Saved" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to get dashboard data for admin panel
const appointmentDelete = async (req, res) => {
  try {
    const { appointmentId } = req.body;

    let appointmentData = null;

    try {
      appointmentData = await appointmentModel.findById(appointmentId);
    } catch (error) {
      appointmentData = memoryStorage.appointments.findById(appointmentId);
    }

    if (appointmentData?.docId && appointmentData?.slotDate && appointmentData?.slotTime) {
      await updateDoctorSlot(
        appointmentData.docId,
        appointmentData.slotDate,
        appointmentData.slotTime,
        "remove"
      );
    }

    try {
      if (canUseDbObjectId(appointmentId)) {
        await appointmentModel.findByIdAndDelete(appointmentId);
      } else {
        throw new Error("Using memory storage");
      }
    } catch (error) {
      memoryStorage.appointments.findByIdAndDelete(appointmentId);
    }

    res.json({ success: true, message: "Appointment Deleted" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to renew NHIS expiry date for an appointment
const renewNhis = async (req, res) => {
  try {
    const { appointmentId, expiryDate } = req.body;

    if (!appointmentId) return res.json({ success: false, message: 'appointmentId missing' });

    let appointmentData = null;
    try {
      appointmentData = await appointmentModel.findById(appointmentId);
    } catch (error) {
      appointmentData = memoryStorage.appointments.findById(appointmentId);
    }

    if (!appointmentData) return res.json({ success: false, message: 'Appointment not found' });

    const nhisDetails = appointmentData.nhisDetails || {};
    nhisDetails.expiryDate = expiryDate || nhisDetails.expiryDate;

    try {
      if (canUseDbObjectId(appointmentId)) {
        await appointmentModel.findByIdAndUpdate(appointmentId, { nhisDetails });
      } else {
        throw new Error('Using memory storage');
      }
    } catch (error) {
      memoryStorage.appointments.findByIdAndUpdate(appointmentId, { nhisDetails });
    }

    res.json({ success: true, message: 'NHIS expiry updated' });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to delete NHIS details from an appointment
const deleteNhis = async (req, res) => {
  try {
    const { appointmentId } = req.body;

    if (!appointmentId) return res.json({ success: false, message: 'appointmentId missing' });

    let appointmentData = null;
    try {
      appointmentData = await appointmentModel.findById(appointmentId);
    } catch (error) {
      appointmentData = memoryStorage.appointments.findById(appointmentId);
    }

    if (!appointmentData) return res.json({ success: false, message: 'Appointment not found' });

    try {
      if (canUseDbObjectId(appointmentId)) {
        await appointmentModel.findByIdAndUpdate(appointmentId, { nhisDetails: null });
      } else {
        throw new Error('Using memory storage');
      }
    } catch (error) {
      memoryStorage.appointments.findByIdAndUpdate(appointmentId, { nhisDetails: null });
    }

    res.json({ success: true, message: 'NHIS details removed' });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const adminDashboard = async (req, res) => {
  try {
    let doctors;
    let users;
    let appointments;

    try {
      doctors = await doctorModel.find({});
    } catch (error) {
      console.log("Database not available, using memory storage for admin doctors");
      doctors = memoryStorage.doctors.find({});
    }

    try {
      users = await userModel.find({});
    } catch (error) {
      console.log("Database not available, using memory storage for admin users");
      users = memoryStorage.users.find({});
    }

    try {
      appointments = await appointmentModel.find({});
    } catch (error) {
      console.log("Database not available, using memory storage for admin appointments");
      appointments = memoryStorage.appointments.find({});
    }

    if (!doctors || doctors.length === 0) {
      doctors = memoryStorage.doctors.find({});
    }

    if (!users || users.length === 0) {
      users = memoryStorage.users.find({});
    }

    if (!appointments || appointments.length === 0) {
      appointments = memoryStorage.appointments.find({});
    }

    const activeAppointments = (appointments || []).filter(
      (appointment) => !appointment?.cancelled
    );
    const uniquePatients = [
      ...new Set(activeAppointments.map((appointment) => appointment.userId).filter(Boolean)),
    ];

    const dashData = {
      doctors: doctors.length,
      appointments: activeAppointments.length,
      patients: uniquePatients.length,
      latestAppointments: [...activeAppointments].reverse().slice(0, 5),
    };

    res.json({ success: true, dashData });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export {
  addDoctor,
  loginAdmin,
  allDoctors,
  appointmentsAdmin,
  appointmentCancel,
  updateAppointment,
  appointmentDelete,
  renewNhis,
  deleteNhis,
  adminDashboard,
};
