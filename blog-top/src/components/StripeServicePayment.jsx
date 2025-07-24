// src/components/StripeServicePayment.jsx
import { useEffect, useState } from 'react';

const StripeServicePayment = ({ userId }) => {
  const [csrfToken, setCsrfToken] = useState('');
  const [loading, setLoading] = useState(false);

  // Get CSRF token once
  useEffect(() => {
    fetch('/api/csrf-token', { credentials: 'include' })
      .then(res => res.json())
      .then(data => setCsrfToken(data.csrfToken))
      .catch(console.error);
  }, []);

  const handleStripeCheckout = async () => {
    if (!userId || !csrfToken) return alert('Missing user or CSRF token');

    setLoading(true);

    try {
      const res = await fetch('/api/payment/initialize-stripe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'CSRF-Token': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify({ action: "initialize", userId }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url; // Stripe Checkout redirect
      } else {
        alert(data.message || 'Something went wrong');
      }
    } catch (err) {
        
      console.error('Stripe checkout error:', err);
      alert('Error initiating payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="text-center my-4">
      <button
        onClick={handleStripeCheckout}
        disabled={loading}
        className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
      >
        {loading ? 'Redirecting to Stripe...' : 'Pay with Stripe'}
      </button>
    </div>
  );
};

export default StripeServicePayment;
