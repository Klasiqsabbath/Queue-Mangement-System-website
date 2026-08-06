import doctorModel from "../models/doctorModel.js";
import bycrypt from "bcrypt";
import jwt from "jsonwebtoken";
import appointmentModel from "../models/appointmentModel.js";

// Static doctors data for development/demo mode
const staticDoctorsData = [
  {
    _id: 'doc1',
    name: 'Dr. Richard James',
    image: 'doc1.png',
    speciality: 'General physician',
    degree: 'MBBS',
    experience: '4 Years',
    about: 'Dr. James has a strong commitment to delivering comprehensive medical care, focusing on preventive medicine, early diagnosis, and effective treatment strategies.',
    fees: 50,
    address: {
        line1: '17th Cross, Richmond',
        line2: 'Circle, Ring Road, London'
    },
    available: true,
    slots_booked: {}
  },
  {
    _id: 'doc2',
    name: 'Dr. Emily Larson',
    image: 'doc2.png',
    speciality: 'Gynecologist',
    degree: 'MBBS',
    experience: '3 Years',
    about: 'Dr. Larson has a strong commitment to delivering comprehensive medical care, focusing on preventive medicine, early diagnosis, and effective treatment strategies.',
    fees: 60,
    address: {
        line1: '27th Cross, Richmond',
        line2: 'Circle, Ring Road, London'
    },
    available: true,
    slots_booked: {}
  },
  {
    _id: 'doc3',
    name: 'Dr. Sarah Patel',
    image: 'doc3.png',
    speciality: 'Dermatologist',
    degree: 'MBBS',
    experience: '1 Years',
    about: 'Dr. Patel has a strong commitment to delivering comprehensive medical care, focusing on preventive medicine, early diagnosis, and effective treatment strategies.',
    fees: 30,
    address: {
        line1: '37th Cross, Richmond',
        line2: 'Circle, Ring Road, London'
    },
    available: true,
    slots_booked: {}
  },
  {
    _id: 'doc4',
    name: 'Dr. Christopher Lee',
    image: 'doc4.png',
    speciality: 'Pediatricians',
    degree: 'MBBS',
    experience: '2 Years',
    about: 'Dr. Lee has a strong commitment to delivering comprehensive medical care, focusing on preventive medicine, early diagnosis, and effective treatment strategies.',
    fees: 40,
    address: {
        line1: '47th Cross, Richmond',
        line2: 'Circle, Ring Road, London'
    },
    available: true,
    slots_booked: {}
  },
  {
    _id: 'doc5',
    name: 'Dr. Jennifer Garcia',
    image: 'doc5.png',
    speciality: 'Neurologist',
    degree: 'MBBS',
    experience: '4 Years',
    about: 'Dr. Garcia has a strong commitment to delivering comprehensive medical care, focusing on preventive medicine, early diagnosis, and effective treatment strategies.',
    fees: 50,
    address: {
        line1: '57th Cross, Richmond',
        line2: 'Circle, Ring Road, London'
    },
    available: true,
    slots_booked: {}
  },
  {
    _id: 'doc6',
    name: 'Dr. Andrew Williams',
    image: 'doc6.png',
    speciality: 'Neurologist',
    degree: 'MBBS',
    experience: '4 Years',
    about: 'Dr. Williams has a strong commitment to delivering comprehensive medical care, focusing on preventive medicine, early diagnosis, and effective treatment strategies.',
    fees: 50,
    address: {
        line1: '57th Cross, Richmond',
        line2: 'Circle, Ring Road, London'
    },
    available: true,
    slots_booked: {}
  },
  {
    _id: 'doc7',
    name: 'Dr. Christopher Davis',
    image: 'doc7.png',
    speciality: 'General physician',
    degree: 'MBBS',
    experience: '4 Years',
    about: 'Dr. Davis has a strong commitment to delivering comprehensive medical care, focusing on preventive medicine, early diagnosis, and effective treatment strategies.',
    fees: 50,
    address: {
        line1: '17th Cross, Richmond',
        line2: 'Circle, Ring Road, London'
    },
    available: true,
    slots_booked: {}
  },
  {
    _id: 'doc8',
    name: 'Dr. Timothy White',
    image: 'doc8.png',
    speciality: 'Gynecologist',
    degree: 'MBBS',
    experience: '3 Years',
    about: 'Dr. White has a strong commitment to delivering comprehensive medical care, focusing on preventive medicine, early diagnosis, and effective treatment strategies.',
    fees: 60,
    address: {
        line1: '27th Cross, Richmond',
        line2: 'Circle, Ring Road, London'
    },
    available: true,
    slots_booked: {}
  },
  {
    _id: 'doc9',
    name: 'Dr. Ava Mitchell',
    image: 'doc9.png',
    speciality: 'Dermatologist',
    degree: 'MBBS',
    experience: '1 Years',
    about: 'Dr. Mitchell has a strong commitment to delivering comprehensive medical care, focusing on preventive medicine, early diagnosis, and effective treatment strategies.',
    fees: 1,
    address: {
        line1: '37th Cross, Richmond',
        line2: 'Circle, Ring Road, London'
    },
    available: true,
    slots_booked: {}
  },
  {
    _id: 'doc10',
    name: 'Dr. Jeffrey King',
    image: 'doc10.png',
    speciality: 'Pediatricians',
    degree: 'MBBS',
    experience: '2 Years',
    about: 'Dr. King has a strong commitment to delivering comprehensive medical care, focusing on preventive medicine, early diagnosis, and effective treatment strategies.',
    fees: 40,
    address: {
        line1: '47th Cross, Richmond',
        line2: 'Circle, Ring Road, London'
    },
    available: true,
    slots_booked: {}
  },
  {
    _id: 'doc11',
    name: 'Dr. Zoe Kelly',
    image: 'doc11.png',
    speciality: 'Gastroenterologist',
    degree: 'MBBS',
    experience: '4 Years',
    about: 'Dr. Kelly has a strong commitment to delivering comprehensive medical care, focusing on preventive medicine, early diagnosis, and effective treatment strategies.',
    fees: 50,
    address: {
        line1: '57th Cross, Richmond',
        line2: 'Circle, Ring Road, London'
    },
    available: true,
    slots_booked: {}
  },
  {
    _id: 'doc12',
    name: 'Dr. Patrick Harris',
    image: 'doc12.png',
    speciality: 'Neurologist',
    degree: 'MBBS',
    experience: '4 Years',
    about: 'Dr. Harris has a strong commitment to delivering comprehensive medical care, focusing on preventive medicine, early diagnosis, and effective treatment strategies.',
    fees: 50,
    address: {
        line1: '57th Cross, Richmond',
        line2: 'Circle, Ring Road, London'
    },
    available: true,
    slots_booked: {}
  },
  {
    _id: 'doc13',
    name: 'Dr. Chloe Evans',
    image: 'doc13.png',
    speciality: 'General physician',
    degree: 'MBBS',
    experience: '4 Years',
    about: 'Dr. Evans has a strong commitment to delivering comprehensive medical care, focusing on preventive medicine, early diagnosis, and effective treatment strategies.',
    fees: 50,
    address: {
        line1: '17th Cross, Richmond',
        line2: 'Circle, Ring Road, London'
    },
    available: true,
    slots_booked: {}
  },
  {
    _id: 'doc14',
    name: 'Dr. Ryan Martinez',
    image: 'doc14.png',
    speciality: 'Gynecologist',
    degree: 'MBBS',
    experience: '3 Years',
    about: 'Dr. Martinez has a strong commitment to delivering comprehensive medical care, focusing on preventive medicine, early diagnosis, and effective treatment strategies.',
    fees: 60,
    address: {
        line1: '27th Cross, Richmond',
        line2: 'Circle, Ring Road, London'
    },
    available: true,
    slots_booked: {}
  },
  {
    _id: 'doc15',
    name: 'Dr. Amelia Hill',
    image: 'doc15.png',
    speciality: 'Dermatologist',
    degree: 'MBBS',
    experience: '1 Years',
    about: 'Dr. Hill has a strong commitment to delivering comprehensive medical care, focusing on preventive medicine, early diagnosis, and effective treatment strategies.',
    fees: 30,
    address: {
        line1: '37th Cross, Richmond',
        line2: 'Circle, Ring Road, London'
    },
    available: true,
    slots_booked: {}
  }
];

const isSameDayAppointment = (appointment, targetDate = new Date()) => {
  if (!appointment?.slotDate) return false;

  const [day, month, year] = String(appointment.slotDate).split("_").map(Number);
  if ([day, month, year].some(Number.isNaN)) return false;

  const appointmentDate = new Date(year, month - 1, day);

  return (
    appointmentDate.getFullYear() === targetDate.getFullYear() &&
    appointmentDate.getMonth() === targetDate.getMonth() &&
    appointmentDate.getDate() === targetDate.getDate()
  );
};

const getTodayAppointments = (appointments = []) =>
  appointments.filter((appointment) => isSameDayAppointment(appointment));

const changeAvailability = async (req, res) => {
  try {
    const { docId } = req.body;
    const docData = await doctorModel.findById(docId);
    await doctorModel.findByIdAndUpdate(docId, {
      available: !docData.available,
    });
    res.json({ success: true, message: "Availability changed" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const doctorList = async (req, res) => {
  try {
    let doctors;
    
    try {
      // Try to get doctors from database first
      doctors = await doctorModel.find({}).select(["-password", "-email"]);
      
      // If database returns empty array, use static data
      if (!doctors || doctors.length === 0) {
        throw new Error("No doctors in database, using static data");
      }
    } catch (error) {
      // If database query fails, return static data
      console.log("Database not available, using static doctors data");
      doctors = staticDoctorsData;
    }

    res.json({ success: true, doctors });
  } catch (error) {
    console.log("Error in doctorList:", error);
    // Fallback to static data as last resort
    res.json({ success: true, doctors: staticDoctorsData });
  }
};

// API for doctor Login
const loginDoctor = async (req, res) => {
  try {
    const { email, password } = req.body;
    const doctor = await doctorModel.findOne({ email });

    if (!doctor) {
      return res.json({ success: false, message: "Invalid credentials" });
    }

    const isMatch = await bycrypt.compare(password, doctor.password);

    if (isMatch) {
      const token = jwt.sign({ id: doctor._id }, process.env.JWT_SECRET);
      res.json({ success: true, token });
    } else {
      res.json({ success: false, message: "Invalid credentials" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to get doctor appointments for doctor panel
const appointmentsDoctor = async (req, res) => {
  try {
    const { docId } = req.body;
    const appointments = await appointmentModel.find({ docId });
    const todayAppointments = getTodayAppointments(appointments);

    res.json({ success: true, appointments: todayAppointments });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to mark appointment completed for doctor panel
const appointmentComplete = async (req, res) => {
  try {
    const { docId, appointmentId } = req.body;
    const appointmentData = await appointmentModel.findById(appointmentId);

    if (appointmentData && appointmentData.docId === docId) {
      await appointmentModel.findByIdAndUpdate(appointmentId, {
        isCompleted: true,
      });
      return res.json({ success: true, message: "Appointment Completed" });
    } else {
      return res.json({ success: false, message: "Mark Failed" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to cancel appointment for doctor panel
const appointmentCancel = async (req, res) => {
  try {
    const { docId, appointmentId } = req.body;
    const appointmentData = await appointmentModel.findById(appointmentId);

    if (appointmentData && appointmentData.docId === docId) {
      await appointmentModel.findByIdAndUpdate(appointmentId, {
        cancelled: true,
      });
      return res.json({ success: true, message: "Appointment Cancelled" });
    } else {
      return res.json({ success: false, message: "Cancellation Failed" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to get dashboard data for doctor panel
const doctorDashboard = async (req, res) => {
  try {
    const { docId } = req.body;
    const appointments = await appointmentModel.find({ docId });
    const todayAppointments = getTodayAppointments(appointments);
    const activeAppointments = todayAppointments.filter((item) => !item.cancelled);

    let earnings = 0;

    activeAppointments.forEach((item) => {
      if (item.isCompleted) {
        earnings += item.amount;
      }
    });

    let patients = [];

    activeAppointments.forEach((item) => {
      if (!patients.includes(item.userId)) {
        patients.push(item.userId);
      }
    });

    const dashData = {
      earnings,
      appointments: activeAppointments.length,
      patients: patients.length,
      latestAppointments: [...todayAppointments].reverse().slice(0, 5),
    };

    res.json({ success: true, dashData });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to get doctor profile for Doctor panel
const doctorProfile = async (req, res) => {
  try {
    const { docId } = req.body;
    const profileData = await doctorModel.findById(docId).select("-password");

    res.json({ success: true, profileData });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to update doctor profile data from Doctor panel
const updateDoctorProfile = async (req, res) => {
  try {
    const { docId, fees, address, available } = req.body;

    await doctorModel.findByIdAndUpdate(docId, { fees, address, available });

    res.json({ success: true, message: "Profile Updated" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export {
  changeAvailability,
  doctorList,
  loginDoctor,
  appointmentsDoctor,
  appointmentCancel,
  appointmentComplete,
  doctorDashboard,
  doctorProfile,
  updateDoctorProfile,
};
