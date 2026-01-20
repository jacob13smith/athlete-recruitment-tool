"use client";

import { useState } from "react";

export default function TestStripePage() {
  const [loading, setLoading] = useState(false);

  async function handleCheckout() {
    setLoading(true);

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // For MVP: pass a test user ID
          userId: "test-user-123",
        }),
      });

      const data = await res.json();

      if (data.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url;
      } else {
        console.error(data);
        alert("Failed to create checkout session");
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      alert("Error creating checkout session");
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 40, textAlign: "center" }}>
      <h1>Stripe Test Checkout</h1>
      <button
        onClick={handleCheckout}
        disabled={loading}
        style={{
          padding: "12px 24px",
          fontSize: "16px",
          borderRadius: "8px",
          backgroundColor: "#635bff",
          color: "white",
          border: "none",
          cursor: "pointer",
        }}
      >
        {loading ? "Redirecting…" : "Pay $49 / year"}
      </button>
    </div>
  );
}
