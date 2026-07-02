import { useState, useCallback } from "react";

const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:4000" : "");

export function useBooking() {
  // --- Calendar Availability States ---
  const [availability, setAvailability] = useState([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [error, setError] = useState(null);

  // --- Multi-Step Booking Form States ---
  const [step, setStep] = useState(0); // 0: calendar selection, 1: form details, 2: success card, 3: track lookup
  const [selectedDate, setSelectedDate] = useState(null); // stores { date, timeSlot }
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    service: "Interior Design",
    meetingType: "free_consultation",
    budget: "Under ETB 30,000",
    message: "",
    services: [],
    projectDescription: ""
  });

  // --- Submission States ---
  const [submitting, setSubmitting] = useState(false);
  const [submittedBooking, setSubmittedBooking] = useState(null);
  const [submitError, setSubmitError] = useState("");

  // --- Booking Tracking Lookup States ---
  const [lookupRef, setLookupRef] = useState("");
  const [lookupResult, setLookupResult] = useState(null);
  const [lookupError, setLookupError] = useState("");
  const [looking, setLooking] = useState(false);

  // Fetch slot availability for selected date
  const fetchAvailability = useCallback(async (dateStr) => {
    if (!dateStr) return;
    setAvailabilityLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/bookings/availability?date=${dateStr}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch availability");
      setAvailability(data.available ? data.available.map(slot => ({ timeSlot: slot, available: true })) : []);
    } catch (err) {
      setError(err.message);
      setAvailability([]);
    } finally {
      setAvailabilityLoading(false);
    }
  }, []);

  // Submit new booking to DB
  const submit = useCallback(async () => {
    setSubmitting(true);
    setSubmitError("");
    try {
      const dateObj = selectedDate instanceof Date ? selectedDate : selectedDate?.date;
      const slotStr = selectedDate?.timeSlot;
      if (!dateObj || !slotStr) {
        throw new Error("Please select a date and time slot first.");
      }

      // Format correct timezone date offset ISO string
      const localDate = new Date(dateObj);
      localDate.setHours(12, 0, 0, 0); // avoid date shifting during timezone conversion

      const payload = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        service: form.service,
        meetingType: form.meetingType,
        budget: form.budget,
        projectDescription: form.projectDescription,
        date: localDate.toISOString(),
        timeSlot: slotStr
      };

      const res = await fetch(`${API_BASE}/api/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to register appointment");
      setSubmittedBooking(data.booking);
      setStep(2); // Move to stage 2 (ticket receipt stage)
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  }, [form, selectedDate]);

  // Lookup booking reference
  const handleLookup = useCallback(async (customRef) => {
    const targetRef = customRef || lookupRef;
    if (!targetRef.trim()) return;
    setLooking(true);
    setLookupError("");
    setLookupResult(null);
    try {
      const res = await fetch(`${API_BASE}/api/bookings/lookup/${targetRef.trim().toUpperCase()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Booking reference not found");
      setLookupResult(data.booking);
      setStep(3); // Move to stage 3 (lookup detail view)
    } catch (err) {
      setLookupError(err.message);
    } finally {
      setLooking(false);
    }
  }, [lookupRef]);

  // Public wrapper compatible with BookingPage.jsx
  const lookupBooking = useCallback(async (ref) => {
    setLooking(true);
    setError(null);
    setLookupResult(null);
    try {
      const res = await fetch(`${API_BASE}/api/bookings/lookup/${ref.trim().toUpperCase()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Booking not found");
      setLookupResult(data.booking);
      return data.booking;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLooking(false);
    }
  }, []);

  const reset = useCallback(() => {
    setStep(0);
    setSelectedDate(null);
    setForm({ name: "", email: "", phone: "", service: "Interior Design", meetingType: "free_consultation", budget: "Under ETB 30,000", message: "", services: [], projectDescription: "" });
    setSubmittedBooking(null);
    setSubmitError("");
    setLookupRef("");
    setLookupResult(null);
    setLookupError("");
    setError(null);
  }, []);

  return {
    // Stage status
    step,
    setStep,

    // Time/date selection
    selectedDate,
    setSelectedDate,
    availability,
    fetchAvailability,
    loading: availabilityLoading,
    availabilityLoading,

    // Form inputs
    form,
    setForm,

    // Register / Create actions
    submit,
    submitting,
    submittedBooking,
    submitError,

    // Ref verification / Tracking
    lookupRef,
    setLookupRef,
    lookupResult,
    setLookupResult,
    lookupError,
    setLookupError,
    looking,
    handleLookup,
    lookupBooking,

    // Reset controls
    reset,
    error,
  };
}
