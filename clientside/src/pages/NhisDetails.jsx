import React, { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { AppContext } from "../context/AppContext";

const NhisDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { backendUrl, token, getDoctorsData } = useContext(AppContext);

  const rawState = location.state || null;
  const bookingData = rawState?.usr || rawState;

  const [nhisName, setNhisName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [membershipNumber, setMembershipNumber] = useState("");
  const [sex, setSex] = useState("");
  const [dateIssued, setDateIssued] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingNhisDetails, setPendingNhisDetails] = useState(null);

  const isMembershipNumberValid = /^\d{8}$/.test(membershipNumber.trim());
  const isNhisFormComplete = [
    nhisName,
    dateOfBirth,
    membershipNumber,
    sex,
    dateIssued,
    expiryDate,
  ].every((value) => value.trim() !== "") && isMembershipNumberValid;

  useEffect(() => {
    if (!bookingData) {
      toast.warn("Booking details were not found. Please start again.");
      navigate("/doctors");
    }
  }, [bookingData, navigate]);

  const handleSubmit = async () => {
    if (!bookingData?.docId || !bookingData?.selectedSlot) {
      toast.error("Booking details are incomplete.");
      return;
    }

    if (!token) {
      toast.warn("Please log in before completing your booking.");
      return navigate("/login");
    }

    if (!isNhisFormComplete) {
      toast.error("Please enter an 8-digit membership number and complete all other NHIS details before booking.");
      return;
    }

    const nhisDetails = {
      name: nhisName.trim(),
      number: membershipNumber.trim(),
      dateOfBirth: dateOfBirth.trim(),
      membershipNumber: membershipNumber.trim(),
      sex: sex.trim(),
      dateIssued: dateIssued.trim(),
      expiryDate: expiryDate.trim(),
    };

    setPendingNhisDetails(nhisDetails);
    setShowConfirmModal(true);
    return;
  };

  const confirmBooking = async () => {
    if (!pendingNhisDetails) {
      toast.error("NHIS details are missing.");
      return;
    }

    setShowConfirmModal(false);
    setSubmitting(true);

    try {
      const date = bookingData.selectedSlot.datetime;
      const slotDate = `${date.getDate()}_${date.getMonth() + 1}_${date.getFullYear()}`;

      const { data } = await axios.post(
        `${backendUrl}/api/user/book-appointment`,
        {
          docId: bookingData.docId,
          slotDate,
          slotTime: bookingData.selectedSlot.time,
          reason: bookingData.reason || "",
          name: bookingData.name,
          phone: bookingData.phone,
          email: bookingData.email || "",
          nhisDetails: pendingNhisDetails,
        },
        {
          headers: {
            token,
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (data.success) {
        if (data.emailResult && !data.emailResult.success) {
          toast.warn(
            data.emailResult.message ||
              "Appointment booked, but confirmation email could not be sent."
          );
        } else {
          toast.success(data.message);
        }

        getDoctorsData();
        const appointmentId = data.appointment?._id || data.appointment?.id;
        if (appointmentId) {
          navigate(`/booking-ticket/${appointmentId}`, {
            state: { appointment: data.appointment },
          });
        } else {
          navigate("/my-appointments");
        }
      } else {
        toast.error(data.message || "Booking failed");
      }
    } catch (error) {
      console.error("Booking request failed", error);
      const message =
        error.response?.data?.message ||
        error.message ||
        "Something went wrong while booking";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!bookingData) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-primary">Step 2 of 2</p>
            <h1 className="text-2xl font-semibold text-gray-800">NHIS & medical details</h1>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 text-sm border border-gray-300 rounded-full text-gray-700"
          >
            Back
          </button>
        </div>

        <div className="mt-6 rounded-2xl bg-slate-50 p-4 border border-slate-200">
          <p className="text-sm font-medium text-gray-700">Booking summary</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs text-gray-500">Doctor</p>
              <p className="text-gray-800 font-medium">{bookingData.docInfo?.name || "Doctor"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Time</p>
              <p className="text-gray-800 font-medium">{bookingData.selectedSlot?.time || "Not selected"}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">NHIS name</p>
            <input
              value={nhisName}
              onChange={(e) => setNhisName(e.target.value)}
              placeholder="Enter NHIS name"
              className="w-full border border-gray-300 rounded-full px-4 py-3 text-sm text-gray-700"
              type="text"
            />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Membership number</p>
            <input
              value={membershipNumber}
              onChange={(e) => setMembershipNumber(e.target.value.replace(/\D/g, "").slice(0, 8))}
              placeholder="Enter 8-digit membership number"
              className="w-full border border-gray-300 rounded-full px-4 py-3 text-sm text-gray-700"
              type="text"
              inputMode="numeric"
              maxLength={8}
            />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Date of birth</p>
            <input
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              placeholder="YYYY-MM-DD"
              className="w-full border border-gray-300 rounded-full px-4 py-3 text-sm text-gray-700"
              type="date"
            />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Sex</p>
            <select
              value={sex}
              onChange={(e) => setSex(e.target.value)}
              className="w-full border border-gray-300 rounded-full px-4 py-3 text-sm text-gray-700"
            >
              <option value="">Select sex</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Date issued</p>
            <input
              value={dateIssued}
              onChange={(e) => setDateIssued(e.target.value)}
              placeholder="YYYY-MM-DD"
              className="w-full border border-gray-300 rounded-full px-4 py-3 text-sm text-gray-700"
              type="date"
            />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Expiry date</p>
            <input
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              placeholder="YYYY-MM-DD"
              className="w-full border border-gray-300 rounded-full px-4 py-3 text-sm text-gray-700"
              type="date"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-center sm:justify-start">
          <button
            onClick={handleSubmit}
            disabled={submitting || !isNhisFormComplete}
            className={`text-sm font-light px-14 py-3 rounded-full transition ${
              submitting || !isNhisFormComplete
                ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                : "bg-primary text-white hover:bg-primary-dark"
            }`}
          >
            {submitting ? "Booking..." : "Complete booking"}
          </button>
        </div>
      </div>

      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
            <p className="text-lg font-semibold text-gray-800">Confirm your booking</p>
            <p className="mt-2 text-sm text-gray-600">
              Please confirm that your NHIS details are correct before submitting this appointment.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="rounded-full border border-gray-300 px-4 py-2 text-sm text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={confirmBooking}
                className="rounded-full bg-primary px-4 py-2 text-sm text-white"
              >
                Confirm booking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NhisDetails;
