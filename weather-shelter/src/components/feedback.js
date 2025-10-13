import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

export default function Feedback() {
  const [feedback, setFeedback] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (feedback.trim().length === 0) return;

    // For now, log or store locally — later can post to backend
    console.log("User Feedback:", feedback);
    setSubmitted(true);
    setFeedback("");

    // Optional: clear after few seconds
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div
      className="container mt-5 mb-5"
      style={{
        maxWidth: "650px",
        background: "#fff",
        borderRadius: "12px",
        boxShadow: "0 6px 16px rgba(0,0,0,0.08)",
        padding: "2rem",
      }}
    >
      <h4 className="mb-3">We’d love your feedback 💬</h4>
      <p className="text-muted" style={{ fontSize: "0.95rem" }}>
        Tell us how the Accessible Weather & Shelter Finder is working for you,
        or suggest improvements.
      </p>

      {!submitted ? (
        <form onSubmit={handleSubmit} aria-label="Feedback form">
          <div className="mb-3">
            <label htmlFor="feedbackText" className="form-label fw-semibold">
              Your Feedback
            </label>
            <textarea
              id="feedbackText"
              className="form-control"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows="4"
              placeholder="Type your feedback here..."
              aria-required="true"
            ></textarea>
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            aria-label="Submit feedback"
          >
            Submit Feedback
          </button>
        </form>
      ) : (
        <div className="alert alert-success mt-3" role="alert">
          ✅ Thank you! Your feedback has been submitted.
        </div>
      )}
    </div>
  );
}