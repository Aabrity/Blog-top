import React from 'react';
import { Link } from 'react-router-dom';

export default function SubscriptionFailure() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-red-50 p-6">
      <h1 className="text-4xl font-bold text-red-700 mb-4">Subscription Failed</h1>
      <p className="mb-6 text-red-800">Your payment could not be processed. Please try again.</p>
      <Link
        to="/payment"  // or wherever your payment page is
        className="bg-red-600 text-white px-5 py-3 rounded hover:bg-red-700 transition"
      >
        Retry Payment
      </Link>
    </div>
  );
}
