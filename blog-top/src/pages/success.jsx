
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function SubscriptionSuccess() {
  const location = useLocation();

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const encodedData = query.get("data");

    if (!encodedData) return;

    const decoded = JSON.parse(atob(encodedData));
    console.log("Esewa success data:", decoded);

    if (decoded.status === "COMPLETE") {
      // ✅ Fetch CSRF token first
      fetch("/api/csrf-token", {
        credentials: "include",
      })
        .then((res) => res.json())
        .then(({ csrfToken }) => {
          // ✅ Now call confirm API with CSRF token
          return fetch("/api/payment/confirm-esewa-payment", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "CSRF-Token": csrfToken, // ✅ CSRF header
            },
            credentials: "include",
            body: JSON.stringify({
              transactionUUID: decoded.transaction_uuid,
              productCode: decoded.product_code,
            }),
          });
        })
        .then((res) => res.json())
        .then((data) => console.log("Subscription updated:", data))
        .catch((err) =>
          console.error("Subscription confirm error (CSRF)", err)
        );
    }
  }, [location]);

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-green-50 p-6">
      <h1 className="text-4xl font-bold text-green-600">Payment Successful!</h1>
      <p className="text-lg mt-4">Thank you for subscribing.</p>
    </div>
  );
}
