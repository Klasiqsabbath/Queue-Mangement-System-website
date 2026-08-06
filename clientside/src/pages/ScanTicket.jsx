import React, { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";

const ScanTicket = () => {
  const { search } = useLocation();
  const [payload, setPayload] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(search);
    const data = params.get("data");
    if (!data) {
      setError("No ticket data found in the QR.");
      return;
    }

    try {
      const decoded = atob(decodeURIComponent(data));
      const obj = JSON.parse(decoded);
      setPayload(obj);
    } catch (e) {
      setError("Invalid ticket data.");
    }
  }, [search]);

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-6 mt-12 bg-white rounded-lg shadow-sm text-center">
        <h2 className="text-xl font-semibold mb-2">Ticket scan failed</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <Link to="/" className="px-4 py-2 bg-primary text-white rounded">Back to home</Link>
      </div>
    );
  }

  if (!payload) {
    return (
      <div className="max-w-2xl mx-auto p-6 mt-12 bg-white rounded-lg shadow-sm text-center">
        <p className="text-gray-600">Reading ticket...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 mt-12 bg-white rounded-lg shadow-sm text-center">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Congratulations!</h1>
        <p className="text-gray-600 mt-2">This ticket is valid for your appointment.</p>
      </div>

      <div className="p-4 border rounded-lg text-left mb-4">
        <p><strong>Patient:</strong> {payload.patientName || "-"}</p>
        <p><strong>Doctor:</strong> {payload.doctorName || "-"}</p>
        <p><strong>Date:</strong> {payload.slotDate || "-"}</p>
        <p><strong>Time:</strong> {payload.slotTime || "-"}</p>
        <p><strong>Fee:</strong> GHS {payload.amount || 1}</p>
        <p><strong>Reference:</strong> {payload.appointmentId || "-"}</p>
      </div>

      <div>
        <Link to="/" className="px-4 py-2 bg-primary text-white rounded">Back to home</Link>
      </div>
    </div>
  );
};

export default ScanTicket;
