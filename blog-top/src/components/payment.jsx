
import { useEffect, useState } from "react";

const EsewaServicePayment = ({ userId }) => {
  const [payment, setPayment] = useState(null);
  const [csrfToken, setCsrfToken] = useState("");

  // Fetch CSRF token on mount
  useEffect(() => {
    fetch("/api/csrf-token", { credentials: "include" })
      .then(res => res.json())
      .then(data => setCsrfToken(data.csrfToken))
      .catch(console.error);
  }, []);

  // Initialize payment
  useEffect(() => {
    if (!userId || !csrfToken) return;

    fetch("/api/payment/initialize-esewa", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "CSRF-Token": csrfToken,
      },
      credentials: "include",
      body: JSON.stringify({ action: "initialize", userId }),
    })
      .then(res => res.json())
      .then(data => setPayment(data.payment))
      .catch(console.error);
  }, [userId, csrfToken]);

  if (!payment) return <p>Loading payment...</p>;

  return (
    <form
      action="https://rc-epay.esewa.com.np/api/epay/main/v2/form"
      method="POST"
    >
      <input type="hidden" name="amount" value={payment.amount} />
      <input type="hidden" name="tax_amount" value={payment.tax_amount} />
      <input type="hidden" name="total_amount" value={payment.total_amount} />
      <input type="hidden" name="transaction_uuid" value={payment.transaction_uuid} />
      <input type="hidden" name="product_code" value={payment.product_code} />
      <input
        type="hidden"
        name="product_service_charge"
        value={payment.product_service_charge}
      />
      <input
        type="hidden"
        name="product_delivery_charge"
        value={payment.product_delivery_charge}
      />
      <input type="hidden" name="success_url" value={payment.success_url} />
      <input type="hidden" name="failure_url" value={payment.failure_url} />
      <input
        type="hidden"
        name="signed_field_names"
        value={payment.signed_field_names}
      />
      <input type="hidden" name="signature" value={payment.signature} />
      <button type="submit">Pay with eSewa</button>
    </form>
  );
};

export default EsewaServicePayment;
