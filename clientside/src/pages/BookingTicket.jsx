import React, { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { useContext } from "react";
import { AppContext } from "../context/AppContext";
import axios from "axios";
import { toast } from "react-toastify";

const PAYSTACK_PUBLIC_KEY = "pk_live_57086526ca13dd99c49ff5ddb207e9e31430e491";

const BookingTicket = () => {
  const location = useLocation();
  const { appointmentId } = useParams();
  const { backendUrl, token } = useContext(AppContext);
  const [appointment, setAppointment] = useState(location.state?.appointment || null);
  const [loading, setLoading] = useState(!location.state?.appointment);
  const [paystackReady, setPaystackReady] = useState(false);

  useEffect(() => {
    if (appointment) {
      setLoading(false);
      return;
    }

    if (!appointmentId || !token) {
      setLoading(false);
      return;
    }

    const fetchAppointment = async () => {
      try {
        const { data } = await axios.get(
          `${backendUrl}/api/user/appointment/${appointmentId}`,
          { headers: { token } }
        );
        if (data.success) {
          setAppointment(data.appointment);
        } else {
          toast.error(data.message);
        }
      } catch (error) {
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointment();
  }, [appointment, appointmentId, backendUrl, token]);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v1/inline.js";
    script.async = true;
    script.onload = () => setPaystackReady(true);
    script.onerror = () => {
      console.error("Paystack script failed to load.");
      toast.error("Unable to load payment service. Please try again later.");
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const payWithPaystack = () => {
    if (!appointment) {
      toast.error("Appointment data not loaded yet.");
      return;
    }

    if (!paystackReady || !window.PaystackPop) {
      toast.error("Payment service is not ready yet. Please wait and try again.");
      return;
    }

    const handler = window.PaystackPop.setup({
      key: PAYSTACK_PUBLIC_KEY,
      email: appointment.userData?.email || "",
      amount: 100, // charge exactly 1 GHS
      currency: "GHS",
      ref: "" + Math.floor(Math.random() * 1000000000 + 1),
      onClose: function () {
        toast.info("Payment window closed before completion.");
      },
      callback: function (response) {
        const message = "Payment complete! Reference: " + response.reference;
        toast.success(message);
      },
    });

    handler.openIframe();
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6 mt-12 bg-white rounded-lg shadow-sm">
        <p className="text-gray-700">Loading booking ticket...</p>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="max-w-4xl mx-auto p-6 mt-12 bg-white rounded-lg shadow-sm">
        <p className="text-lg font-semibold text-gray-800">Booking ticket not found</p>
        <p className="mt-3 text-gray-600">Please return to the home page or check your appointments.</p>
        <Link to="/" className="inline-block mt-5 px-5 py-2 bg-primary text-white rounded">
          Back to home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 mt-12 bg-white rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-gray-500">Booking confirmed</p>
          <h1 className="text-2xl font-semibold text-gray-800">Appointment ticket</h1>
        </div>
        <Link to="/" className="px-4 py-2 text-sm bg-primary text-white rounded">
          Back to home
        </Link>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="p-5 border rounded-lg bg-slate-50">
          <p className="text-sm text-gray-500">Patient</p>
          <p className="mt-2 text-lg font-semibold text-gray-800">{appointment.userData?.name || "Patient"}</p>
          <p className="text-sm text-gray-600">{appointment.userData?.email || "No email"}</p>
        </div>

        <div className="p-5 border rounded-lg bg-slate-50">
          <p className="text-sm text-gray-500">Doctor</p>
          <p className="mt-2 text-lg font-semibold text-gray-800">{appointment.docData?.name || "Doctor"}</p>
          <p className="text-sm text-gray-600">{appointment.docData?.speciality || "Speciality"}</p>
        </div>
      </div>

      <div className="mt-6 p-5 border rounded-lg bg-slate-50">
        <p className="text-sm text-gray-500">Appointment details</p>
        <div className="grid gap-4 mt-3 sm:grid-cols-2">
          <div>
            <p className="text-xs text-gray-500">Date</p>
            <p className="text-lg font-medium text-gray-800">{appointment.slotDate}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Time</p>
            <p className="text-lg font-medium text-gray-800">{appointment.slotTime}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Fee</p>
            <p className="text-lg font-medium text-gray-800">${appointment.amount}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Status</p>
            <p className="text-lg font-medium text-gray-800">
              {appointment.cancelled ? "Cancelled" : appointment.isCompleted ? "Completed" : "Confirmed"}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 p-5 border rounded-lg bg-slate-50">
          <p className="text-sm text-gray-500">Reason for visit</p>
          <p className="mt-2 text-gray-700">{appointment.reason || "Not specified"}</p>
        </div>

        <div className="mt-6 p-5 border rounded-lg bg-slate-50">
        <div className="flex flex-col gap-3">
          <p className="text-sm text-gray-500">Pay for your appointment</p>
          {!appointment.isCompleted && !appointment.cancelled ? (
            <button
              onClick={payWithPaystack}
              className="w-full max-w-xs py-3 px-4 bg-primary text-white rounded-lg hover:bg-primary-dark transition"
            >
              Pay with Paystack
            </button>
          ) : (
            <p className="text-sm text-gray-600">
              {appointment.cancelled
                ? "This appointment was cancelled."
                : "This appointment has already been completed."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingTicket;
