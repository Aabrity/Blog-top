
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { Button } from "flowbite-react";
import { useEffect, useState } from "react";
import { AiFillGoogleCircle } from "react-icons/ai";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { app } from "../firebase";

import { jwtDecode } from "jwt-decode";  // <-- your import style

import { signInSuccess, signoutSuccess } from "../redux/user/userSlice";
import { toast } from "react-hot-toast";

export default function OAuth() {
  const [csrfToken, setCsrfToken] = useState("");
  const auth = getAuth(app);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCSRFToken();
  }, []);

  const fetchCSRFToken = async () => {
    try {
      const res = await fetch("/api/csrf-token", {
        credentials: "include",
      });
      const data = await res.json();
      setCsrfToken(data.csrfToken);
    } catch (err) {
      console.error("Error fetching CSRF token:", err);
    }
  };

  const handleAutoLogout = () => {
    dispatch(signoutSuccess());
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    toast("Session expired. You have been logged out.");
    navigate("/sign-in");
  };

  const handleGoogleClick = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });

    try {
      const result = await signInWithPopup(auth, provider);

      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "CSRF-Token": csrfToken,
        },
        credentials: "include",
        body: JSON.stringify({
          name: result.user.displayName,
          email: result.user.email,
          googlePhotoUrl: result.user.photoURL,
        }),
      });

      const data = await res.json();

      if (res.ok && data.token) {
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("token", data.token);

        // Decode token and set auto logout (following your exact sign-in logic)
        const decoded = jwtDecode(data.token);
        const delay = decoded.exp * 1000 - Date.now();

        setTimeout(() => {
          handleAutoLogout();
        }, delay);

        dispatch(signInSuccess(data.user));
        navigate("/");
      } else {
        toast.error(data.message || "Login failed");
      }
    } catch (error) {
      console.error("Google sign-in error:", error);
      toast.error("Google sign-in failed.");
    }
  };

  return (
    <Button type="button" color="success" outline onClick={handleGoogleClick}>
      <AiFillGoogleCircle className="w-6 h-6 mr-2" />
      Continue with Google
    </Button>
  );
}
