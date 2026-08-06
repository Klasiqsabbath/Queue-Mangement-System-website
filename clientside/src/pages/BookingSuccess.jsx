import React, { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { AppContext } from "../context/AppContext";

const BookingSuccess = () => {
  const location = useLocation();
  const { state, search } = location;
  const navigate = useNavigate();
  const { backendUrl, token, userData } = useContext(AppContext);
  const storedAppointmentId = sessionStorage.getItem("bookingAppointmentId");
  const queryAppointmentId = new URLSearchParams(search).get("appointmentId") || "";
  const [appointmentId] = useState(
    state?.appointmentId || queryAppointmentId || storedAppointmentId || ""
  );
  const [emailStatus, setEmailStatus] = useState("disabled");
  const [emailMessage, setEmailMessage] = useState("Email sending is disabled for this deployment.");

  useEffect(() => {
    if (appointmentId) {
      sessionStorage.setItem("bookingAppointmentId", appointmentId);
    }
  }, [appointmentId]);

  useEffect(() => {
    if (!appointmentId) {
      setEmailStatus("missing");
      setEmailMessage("Missing booking identifier. Please return to the appointment page and try again.");
    }
  }, [appointmentId]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <style>{`
        @keyframes popIn { 0% { transform: scale(0.6); opacity: 0 } 60% { transform: scale(1.08); opacity: 1 } 100% { transform: scale(1); } }
        @keyframes floatConfetti { 0% { transform: translateY(0) } 100% { transform: translateY(-20px) } }
      `}</style>

      <div className="max-w-xl w-full text-center bg-white rounded-lg shadow-lg p-10">
        <div className="flex items-center justify-center mb-6">
          <div style={{ animation: "popIn 700ms ease forwards" }} className="rounded-full bg-green-100 p-6">
            <svg className="w-16 h-16 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        <h1 className="text-2xl font-bold mb-2">Congratulations!</h1>
        <p className="text-gray-600 mb-6">Thank you for your booking. Your appointment is confirmed.</p>

        <div className="bg-slate-50 p-4 rounded mb-6 text-left">
          <p className="text-sm text-gray-500">Booking reference is hidden for security.</p>
          <p className="text-sm text-gray-500 mt-2">{emailMessage}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={() => navigate('/')} className="px-6 py-2 bg-primary text-white rounded">Back to home</button>
        </div>
      </div>
    </div>
  );
};

export default BookingSuccess;
