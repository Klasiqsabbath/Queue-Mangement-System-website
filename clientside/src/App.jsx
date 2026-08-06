import React, { useContext } from "react";
import { Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Doctors from "./pages/Doctors";
import Login from "./pages/Login";
import About from "./pages/About";
import Contact from "./pages/Contact";
import MyProfile from "./pages/MyProfile";
import MyAppointments from "./pages/MyAppointments";
import BookingTicket from "./pages/BookingTicket";
import BookingSuccess from "./pages/BookingSuccess";
import Appointment from "./pages/Appointment";
import NhisDetails from "./pages/NhisDetails";
import ScanTicket from "./pages/ScanTicket";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AppContext } from "./context/AppContext";

const App = () => {
  const { darkMode } = useContext(AppContext);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"}`}>
      <div className="mx-4 sm:mx-[10%]">
        <ToastContainer />
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/doctors" element={<Doctors />} />
          <Route path="/doctors/:speciality" element={<Doctors />} />
          <Route path="/login" element={<Login />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/my-profile" element={<MyProfile />} />
          <Route path="/my-appointments" element={<MyAppointments />} />
          <Route path="/booking-ticket/:appointmentId" element={<BookingTicket />} />
          <Route path="/booking-success" element={<BookingSuccess />} />
          <Route path="/ticket/scan" element={<ScanTicket />} />
          <Route path="/appointment/:docId" element={<Appointment />} />
          <Route path="/nhis-details" element={<NhisDetails />} />
        </Routes>
        <Footer />
      </div>
    </div>
  );
};

export default App;
