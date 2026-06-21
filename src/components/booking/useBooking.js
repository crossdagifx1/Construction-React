import { useState, useCallback } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

export function useBooking() {
  const [availability, setAvailability] = useState(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const fetchAvailability = useCallback(async (date) => {
    if (!date) return;
    setAvailabilityLoading(true);
    setError(null);
    try {
      const iso = date instanceof Date ? date.toISOString().split("T")[0] : date;
      const res = await fetch(`${API_BASE}/api/bookings/availability?date=${iso}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAvailability(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setAvailabilityLoading(false);
    }
  }, []);

  const submitBooking = useCallback(async (formData) => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess(true);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setSubmitting(false);
    }
  }, []);

  const reset = useCallback(() => {
    setSuccess(false);
    setError(null);
    setAvailability(null);
  }, []);

  return {
    availability,
    availabilityLoading,
    submitting,
    success,
    error,
    fetchAvailability,
    submitBooking,
    reset,
  };
}
