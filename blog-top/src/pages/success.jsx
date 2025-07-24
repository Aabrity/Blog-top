
// // import { useEffect } from "react";
// // import { useLocation } from "react-router-dom";

// // export default function SubscriptionSuccess() {
// //   const location = useLocation();

// //   useEffect(() => {
// //     const query = new URLSearchParams(location.search);
// //     const encodedData = query.get("data");

// //     if (!encodedData) return;

// //     const decoded = JSON.parse(atob(encodedData));
// //     console.log("Esewa success data:", decoded);

// //     if (decoded.status === "COMPLETE") {
// //       // ✅ Fetch CSRF token first
// //       fetch("/api/csrf-token", {
// //         credentials: "include",
// //       })
// //         .then((res) => res.json())
// //         .then(({ csrfToken }) => {
// //           // ✅ Now call confirm API with CSRF token
// //           return fetch("/api/payment/confirm-esewa-payment", {
// //             method: "POST",
// //             headers: {
// //               "Content-Type": "application/json",
// //               "CSRF-Token": csrfToken, // ✅ CSRF header
// //             },
// //             credentials: "include",
// //             body: JSON.stringify({
// //               transactionUUID: decoded.transaction_uuid,
// //               productCode: decoded.product_code,
// //             }),
// //           });
// //         })
// //         .then((res) => res.json())
// //         .then((data) => console.log("Subscription updated:", data))
// //         .catch((err) =>
// //           console.error("Subscription confirm error (CSRF)", err)
// //         );
// //     }
// //   }, [location]);

// //   return (
// //     <div className="min-h-screen flex flex-col justify-center items-center bg-green-50 p-6">
// //       <h1 className="text-4xl font-bold text-green-600">Payment Successful!</h1>
// //       <p className="text-lg mt-4">Thank you for subscribing.</p>
// //     </div>
// //   );
// // }
// import { useEffect } from "react";
// import { useLocation } from "react-router-dom";

// export default function SubscriptionSuccess() {
//   const location = useLocation();

//   useEffect(() => {
//     const query = new URLSearchParams(location.search);
//     const encodedData = query.get("data");
//     const stripeSessionId = query.get("session_id");

//     // ✅ For eSewa
//     if (encodedData) {
//       const decoded = JSON.parse(atob(encodedData));
//       console.log("Esewa success data:", decoded);

//       if (decoded.status === "COMPLETE") {
//         fetch("/api/csrf-token", {
//           credentials: "include",
//         })
//           .then((res) => res.json())
//           .then(({ csrfToken }) => {
//             return fetch("/api/payment/confirm-esewa-payment", {
//               method: "POST",
//               headers: {
//                 "Content-Type": "application/json",
//                 "CSRF-Token": csrfToken,
//               },
//               credentials: "include",
//               body: JSON.stringify({
//                 transactionUUID: decoded.transaction_uuid,
//                 productCode: decoded.product_code,
//               }),
//             });
//           })
//           .then((res) => res.json())
//           .then((data) => console.log("eSewa subscription updated:", data))
//           .catch((err) =>
//             console.error("eSewa subscription confirm error", err)
//           );
//       }
//     }

//     // ✅ For Stripe
//     else if (stripeSessionId) {
//       console.log("Stripe session ID detected:", stripeSessionId);

//       fetch("/api/csrf-token", {
//         credentials: "include",
//       })
//         .then((res) => res.json())
//         .then(({ csrfToken }) => {
//           return fetch("/api/payment/confirm-stripe-payment", {
//             method: "POST",
//             headers: {
//               "Content-Type": "application/json",
//               "CSRF-Token": csrfToken,
//             },
//             credentials: "include",
//             // body: JSON.stringify({ sessionId: stripeSessionId }),
//             body: JSON.stringify({ sessionId: stripeSessionId }),

//           });
//         })
//         .then((res) => res.json())
//         .then((data) => console.log("Stripe subscription updated:", data))
//         .catch((err) =>
//           console.error("Stripe subscription confirm error", err)
//         );
//     }
//   }, [location]);

//   return (
//     <div className="min-h-screen flex flex-col justify-center items-center bg-green-50 p-6">
//       <h1 className="text-4xl font-bold text-green-600">Payment Successful!</h1>
//       <p className="text-lg mt-4">Thank you for subscribing.</p>
//     </div>
//   );
// }
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function SubscriptionSuccess() {
  const location = useLocation();

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const encodedEsewaData = query.get("data");
    const stripeSessionId = query.get("session_id");

    if (encodedEsewaData) {
      const decoded = JSON.parse(atob(encodedEsewaData));
      console.log("Esewa success data:", decoded);

      if (decoded.status === "COMPLETE") {
        fetch("/api/csrf-token", { credentials: "include" })
          .then((res) => res.json())
          .then(({ csrfToken }) => {
            return fetch("/api/payment/confirm-esewa-payment", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "CSRF-Token": csrfToken,
              },
              credentials: "include",
              body: JSON.stringify({
                transactionUUID: decoded.transaction_uuid,
                productCode: decoded.product_code,
              }),
            });
          })
          .then((res) => res.json())
          .then((data) => console.log("Esewa subscription updated:", data))
          .catch((err) =>
            console.error("Esewa confirm error (CSRF)", err)
          );
      }
    } else if (stripeSessionId) {
      console.log("Stripe session ID detected:", stripeSessionId);

      fetch("/api/csrf-token", { credentials: "include" })
        .then((res) => res.json())
        .then(({ csrfToken }) => {
          return fetch("/api/payment/confirm-stripe-payment", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "CSRF-Token": csrfToken,
            },
            credentials: "include",
            body: JSON.stringify({ session_id: stripeSessionId }),
          });
        })
        .then((res) => res.json())
        .then((data) => console.log("Stripe subscription updated:", data))
        .catch((err) =>
          console.error("Stripe confirm error (CSRF)", err)
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
