import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AppContext } from "../context/AppContext";
import axios from "axios";
import { toast } from "react-toastify";

const FALLBACK_PAYSTACK_PUBLIC_KEY = "pk_test_5371fc9cb46483d3af948cb0ff1af9240f331a1d";
const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || FALLBACK_PAYSTACK_PUBLIC_KEY;

const BookingTicket = () => {
  const location = useLocation();
  const { appointmentId } = useParams();
  const { backendUrl, token } = useContext(AppContext);
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState(location.state?.appointment || null);
  const [loading, setLoading] = useState(!location.state?.appointment);
  const [paystackReady, setPaystackReady] = useState(false);

  const qrPayload = useMemo(() => {
    if (!appointment) return "";
    return appointment.qrPayload || JSON.stringify({
      appointmentId: appointment._id || appointmentId,
      patientName: appointment.userData?.name || "",
      doctorName: appointment.docData?.name || "",
      slotDate: appointment.slotDate || "",
      slotTime: appointment.slotTime || "",
      amount: Number(appointment.amount || 1),
      currency: "GHS",
      type: "appointment-ticket",
    });
  }, [appointment, appointmentId]);

  const qrScanUrl = useMemo(() => {
    if (!qrPayload) return "";
    try {
      const encoded = btoa(qrPayload);
      const base = window.location.origin || "";
      return `${base}/ticket/scan?data=${encodeURIComponent(encoded)}`;
    } catch (e) {
      return "";
    }
  }, [qrPayload]);

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
    if (window.PaystackPop) {
      setPaystackReady(true);
      return undefined;
    }

    const existingScript = document.querySelector("script[src*='paystack']");
    if (existingScript) {
      existingScript.onload = () => setPaystackReady(true);
      existingScript.onerror = () => {
        console.error("Paystack script failed to load.");
        toast.error("Unable to load payment service. Please try again later.");
      };
      return undefined;
    }

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
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
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

    const amountInPesewas = 100;
    const handler = window.PaystackPop.setup({
      key: PAYSTACK_PUBLIC_KEY,
      email: appointment.userData?.email || "",
      amount: amountInPesewas,
      currency: "GHS",
      ref: appointment._id || appointmentId,
      label: appointment.docData?.name || "Appointment payment",
      metadata: {
        appointmentId: appointment._id || appointmentId,
        doctorName: appointment.docData?.name || "",
        patientName: appointment.userData?.name || "",
      },
      onClose: function () {
        toast.info("Payment window closed before completion.");
      },
      callback: function (response) {
        const message = "Payment complete! Reference: " + response.reference;
        toast.success(message);
        try {
          const refAppointmentId = appointment._id || appointmentId;
          const successUrl = `/booking-success?appointmentId=${encodeURIComponent(refAppointmentId)}`;
          navigate(successUrl, {
            state: { appointmentId: refAppointmentId, reference: response.reference },
          });
        } catch (err) {
          console.error("Redirect to success page failed", err);
        }
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
        <p className="text-sm text-gray-500">NHIS details</p>
        {appointment.nhisDetails ? (
          <div className="grid gap-3 mt-3 sm:grid-cols-2">
            <div>
              <p className="text-xs text-gray-500">NHIS number</p>
              <p className="text-gray-700">{appointment.nhisDetails.number || "Not provided"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Card number</p>
              <p className="text-gray-700">{appointment.nhisDetails.cardNumber || "Not provided"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Member name</p>
              <p className="text-gray-700">{appointment.nhisDetails.memberName || "Not provided"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Provider</p>
              <p className="text-gray-700">{appointment.nhisDetails.provider || "Not provided"}</p>
            </div>
          </div>
        ) : (
          <p className="mt-2 text-gray-700">No NHIS details were provided.</p>
        )}
      </div>

      <div className="mt-6 p-5 border rounded-lg bg-slate-50">
        <p className="text-sm text-gray-500">Scan QR to check in</p>
        <p className="mt-2 text-sm text-gray-600">
          This ticket can be scanned by the clinic to confirm your appointment details.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <div className="min-h-[180px] min-w-[180px] rounded-lg border bg-white p-4">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrScanUrl || qrPayload)}`}
              alt="Appointment QR code"
              className="h-[180px] w-[180px] object-contain"
            />
          </div>
          <div className="max-w-md text-sm text-gray-700">
            <p><strong>Reference:</strong> {appointment._id || appointmentId}</p>
            <p><strong>Doctor:</strong> {appointment.docData?.name || "Doctor"}</p>
            <p><strong>Date:</strong> {appointment.slotDate}</p>
            <p><strong>Time:</strong> {appointment.slotTime}</p>
            <p><strong>Fee:</strong> GHS {Number(appointment.amount || 1).toFixed(0)}</p>
          </div>
        </div>
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
