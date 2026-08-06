import React, { useContext, useEffect } from "react";
import { Link } from "react-router-dom";
import { AdminContext } from "../../context/AdminContext";
import { AppContext } from "../../context/AppContext";
import { useState } from "react";

const NhisRecords = () => {
  const { aToken, appointments, getAllAppointments } = useContext(AdminContext);
  const { slotDateFormat } = useContext(AppContext);

  useEffect(() => {
    if (aToken) {
      getAllAppointments();
    }
  }, [aToken, getAllAppointments]);

  const nhisAppointments = (appointments || []).filter((item) => {
    const details = item?.nhisDetails || {};
    return Object.values(details).some(
      (value) => value !== undefined && value !== null && value !== ""
    );
  });

  const [processingId, setProcessingId] = useState(null);

  const handleRenew = async (id) => {
    setProcessingId(id);
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    await renewNhis(id, nextYear.toISOString().split("T")[0]);
    setProcessingId(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remove NHIS details for this appointment?")) return;
    setProcessingId(id);
    await deleteNhis(id);
    setProcessingId(null);
  };

  return (
    <div className="w-full max-w-7xl m-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-lg font-medium">NHIS Records</p>
        <span className="text-sm text-gray-500">{nhisAppointments.length} record(s)</span>
      </div>

      <div className="bg-white border rounded text-sm overflow-x-auto">
        {nhisAppointments.length === 0 ? (
          <div className="p-6 text-gray-500">No NHIS details have been submitted yet.</div>
        ) : (
          <table className="min-w-full">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Patient</th>
                <th className="px-4 py-3">Appointment</th>
                <th className="px-4 py-3">NHIS No.</th>
                <th className="px-4 py-3">DOB</th>
                <th className="px-4 py-3">Membership No.</th>
                <th className="px-4 py-3">Sex</th>
                <th className="px-4 py-3">Issued</th>
                <th className="px-4 py-3">Expiry</th>
                <th className="px-4 py-3">Anamnesis</th>
              </tr>
            </thead>
            <tbody>
              {nhisAppointments.map((item, index) => {
                const details = item?.nhisDetails || {};
                return (
                  <tr key={item._id || index} className="border-t text-gray-700 hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <Link to={`/appointment/${item._id}`} className="font-medium text-blue-600 hover:underline">
                        {item.userData?.name || "Unknown patient"}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        <p>{slotDateFormat(item.slotDate)}</p>
                        <p className="text-gray-500">{item.slotTime}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">{details.number || "-"}</td>
                    <td className="px-4 py-3">{details.dateOfBirth || "-"}</td>
                    <td className="px-4 py-3">{details.membershipNumber || "-"}</td>
                    <td className="px-4 py-3">{details.sex || "-"}</td>
                    <td className="px-4 py-3">{details.dateIssued || "-"}</td>
                    <td className="px-4 py-3">{details.expiryDate || "-"}</td>
                    <td className="px-4 py-3 max-w-xs whitespace-pre-wrap">{details.anamnesis || "-"}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          disabled={processingId === item._id}
                          onClick={() => handleRenew(item._id)}
                          className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:scale-105 transform transition"
                        >
                          {processingId === item._id ? "Processing" : "Renew"}
                        </button>
                        <button
                          disabled={processingId === item._id}
                          onClick={() => handleDelete(item._id)}
                          className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:scale-105 transform transition"
                        >
                          {processingId === item._id ? "Processing" : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default NhisRecords;
