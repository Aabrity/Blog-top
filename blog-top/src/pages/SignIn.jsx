
"use client";

import { Button, Spinner, TextInput } from "flowbite-react";
import { jwtDecode } from "jwt-decode";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import comunity from "../assets/comunity.png";
import OAuth from "../components/OAuth";
import {
  resetLoading,
  signInFailure,
  signInStart,
  signInSuccess
} from "../redux/user/userSlice";

export default function SignIn() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [captchaSVG, setCaptchaSVG] = useState("");
  const [captcha, setCaptcha] = useState("");
  const [csrfToken, setCsrfToken] = useState("");

  const [signinStep, setSigninStep] = useState(0);
  const [userId, setUserId] = useState(null);
  const [otp, setOtp] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);

  const [forgotEmail, setForgotEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [forgotStep, setForgotStep] = useState(0);
  const [forgotLoading, setForgotLoading] = useState(false);

  // New state for password expiry reset flow
  const [passwordExpiredStep, setPasswordExpiredStep] = useState(0);
  const [oldPassword, setOldPassword] = useState("");
  const [expiredNewPassword, setExpiredNewPassword] = useState("");
  const [expiredConfirmPassword, setExpiredConfirmPassword] = useState("");
  const [passwordExpiredLoading, setPasswordExpiredLoading] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector((state) => state.user);

  useEffect(() => {
    dispatch(resetLoading());
    fetchCaptcha();
    fetchCSRFToken();
  }, []);

  const fetchCaptcha = async () => {
    try {
      const res = await fetch(`/api/auth/captcha?${Date.now()}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch captcha");
      const svgText = await res.text();
      setCaptchaSVG(svgText);
    } catch (error) {
      console.error("Error fetching CAPTCHA:", error);
      toast.error("Failed to load CAPTCHA.");
    }
  };

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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value.trim() });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password || !captcha) {
      toast.error("Please fill all the fields including CAPTCHA");
      dispatch(signInFailure("Please fill all the fields including CAPTCHA"));
      return;
    }

    try {
      dispatch(signInStart()); // <-- Start loading here!

      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "CSRF-Token": csrfToken,
        },
        credentials: "include",
        body: JSON.stringify({ ...formData, captcha }),
      });

      const data = await res.json();

      if (!res.ok || data.success === false) {
        // Check if password expired
        if (data.passwordExpired) {
          toast.error("Your password has expired. Please reset it.");
          setPasswordExpiredStep(1);
          setForgotEmail(formData.email);
          setOldPassword(formData.password);
          return;
        }

        toast.error(data.message || "Sign-in failed");
        fetchCaptcha();
        dispatch(signInFailure(data.message)); // <-- Stop loading & set error
        return;
      }

      toast.success("OTP sent to your email.");
      setUserId(data.userId);
      setSigninStep(1);

      dispatch(signInSuccess(data.user)); // <-- Stop loading & set user
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        "Your account has been locked out due to too many failed attempts. Please try again 10 minutes later.";
      toast.error(msg);
      dispatch(signInFailure(msg)); // <-- Stop loading & set error
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp) {
      toast.error("Please enter OTP");
      return;
    }
    setOtpLoading(true);
    try {
      const res = await fetch("/api/auth/verify-signin-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "CSRF-Token": csrfToken,
        },
        credentials: "include",
        body: JSON.stringify({ userId, otp }),
      });

      const data = await res.json();

      if (!res.ok || data.success === false) {
        toast.error(data.message || "OTP verification failed");
        return;
      }

      const decoded = jwtDecode(data.token);
      const delay = decoded.exp * 1000 - Date.now();

      setTimeout(() => {
        handleAutoLogout();
      }, delay);

      localStorage.setItem("user", JSON.stringify(data.user));
      dispatch(signInSuccess(data.user));
      toast.success("Logged in successfully");
      navigate("/");

    } catch (error) {
      toast.error(error.message || "Something went wrong");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleAutoLogout = () => {
    localStorage.removeItem("user");
    fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    toast("Session expired. You have been logged out.");
    navigate("/sign-in");
  };

  const handleForgotRequest = async () => {
    setForgotLoading(true);
    if (!forgotEmail) {
      toast.error("Please enter your email");
      setForgotLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/auth/request-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json", "CSRF-Token": csrfToken },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        toast.error(data.message || "Failed to send OTP");
      } else {
        setForgotStep(1);
        toast.success("OTP sent to your email");
      }
    } catch (error) {
      toast.error("Something went wrong, try again later");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setForgotLoading(true);

    if (!otp || !newPassword || !confirmPassword) {
      toast.error("Please fill all fields");
      setForgotLoading(false);
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      setForgotLoading(false);
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      setForgotLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json", "CSRF-Token": csrfToken },
        body: JSON.stringify({
          email: forgotEmail,
          otp,
          newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        toast.error(data.message || "Failed to reset password");
      } else {
        toast.success("Password reset successful");
        setForgotStep(2);
      }
    } catch (error) {
      toast.error("Something went wrong, try again later");
    } finally {
      setForgotLoading(false);
    }
  };

  // New handler for password expired reset submit
  const handleExpiredPasswordReset = async () => {
    setPasswordExpiredLoading(true);

    if (!oldPassword || !expiredNewPassword || !expiredConfirmPassword) {
      toast.error("Please fill all fields");
      setPasswordExpiredLoading(false);
      return;
    }
    if (expiredNewPassword !== expiredConfirmPassword) {
      toast.error("New passwords do not match");
      setPasswordExpiredLoading(false);
      return;
    }
    if (expiredNewPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      setPasswordExpiredLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/change-expired-password", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", "CSRF-Token": csrfToken },
        body: JSON.stringify({
          email: forgotEmail,
          oldPassword,
          newPassword: expiredNewPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        toast.error(data.message || "Failed to reset expired password");
      } else {
        toast.success("Password reset successful, please sign in again.");
        setPasswordExpiredStep(0);
        setForgotStep(0);
        setSigninStep(0);
        setFormData({ email: "", password: "" });
        setOldPassword("");
        setExpiredNewPassword("");
        setExpiredConfirmPassword("");
      }
    } catch (error) {
      toast.error("Something went wrong, try again later");
    } finally {
      setPasswordExpiredLoading(false);
    }
  };

  const customInputTheme = {
    field: {
      input: {
        base: "block w-full border disabled:cursor-not-allowed disabled:opacity-50",
        colors: {
          gray: "bg-gray-50 border-gray-300 text-gray-900 focus:border-green-500 focus:ring-green-500",
        },
      },
    },
  };

  return (
    <div className="min-h-screen mt-10 px-4">
      <div className="flex flex-col md:flex-row max-w-6xl mx-auto gap-8 items-start">
        <div className="w-full md:w-5/7 relative">
          <div className="bg-white rounded-lg p-2 z-0 relative">
            <img
              src={comunity || "/placeholder.svg"}
              alt="Community illustration"
              className="w-full h-auto object-cover rounded-lg mb-0"
            />
            <div className="bg-offwhite rounded-lg shadow-md p-4 -mt-10 relative z-10 ">
              <p className="text-xsm text-gray-600 space-y-3">
                Welcome back to BlogTop! Sign in to report alerts, help your community,
                or catch up on important local posts. Stay informed and connected with just a few clicks!
              </p>
            </div>
          </div>
        </div>

        <div className="w-full mt-12 md:w-1/2">

          {/* PASSWORD EXPIRED RESET FORM */}
          {passwordExpiredStep === 1 && (
            <>
              <h1 className="text-center text-2xl font-bold mb-7">Password Expired - Reset Password</h1>
              <div className="border rounded-lg p-4 bg-white-500 space-y-4">
                <TextInput
                  type="password"
                  placeholder="Old Password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  theme={customInputTheme}
                  color="gray"
                  required
                  autoComplete="current-password"
                />
                <TextInput
                  type="password"
                  placeholder="New Password"
                  value={expiredNewPassword}
                  onChange={(e) => setExpiredNewPassword(e.target.value)}
                  theme={customInputTheme}
                  color="gray"
                  required
                  autoComplete="new-password"
                />
                <TextInput
                  type="password"
                  placeholder="Confirm New Password"
                  value={expiredConfirmPassword}
                  onChange={(e) => setExpiredConfirmPassword(e.target.value)}
                  theme={customInputTheme}
                  color="gray"
                  required
                  autoComplete="new-password"
                />
                <Button
                  onClick={handleExpiredPasswordReset}
                  color="success"
                  disabled={passwordExpiredLoading}
                  className="w-full"
                >
                  {passwordExpiredLoading ? <Spinner size="sm" /> : "Reset Password"}
                </Button>
                <button
                  className="text-green-500 text-sm underline hover:no-underline"
                  onClick={() => {
                    setPasswordExpiredStep(0);
                    setFormData({ email: "", password: "" });
                    fetchCaptcha();
                  }}
                >
                  Back to Sign In
                </button>
              </div>
            </>
          )}

          {/* SIGN IN FORM */}
          {passwordExpiredStep === 0 && forgotStep === 0 && signinStep === 0 && (
            <>
              <h1 className="text-center text-2xl font-bold mb-7">SIGN IN</h1>
              <div className="border rounded-lg p-2 bg-white-500">
                <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                  <TextInput
                    type="email"
                    placeholder="name@company.com"
                    id="email"
                    value={formData.email}
                    onChange={handleChange}
                    theme={customInputTheme}
                    color="gray"
                    required
                    autoComplete="email"
                  />
                  <TextInput
                    type="password"
                    placeholder="**********"
                    id="password"
                    value={formData.password}
                    onChange={handleChange}
                    theme={customInputTheme}
                    color="gray"
                    required
                    autoComplete="current-password"
                  />

                  {captchaSVG && (
                    <div className="mt-2">
                      <div
                        dangerouslySetInnerHTML={{ __html: captchaSVG }}
                        className="mb-2"
                      />
                      <button
                        type="button"
                        onClick={fetchCaptcha}
                        className="text-sm text-green-500 underline mb-1"
                      >
                        Refresh CAPTCHA
                      </button>
                      <TextInput
                        type="text"
                        id="captcha"
                        placeholder="Enter CAPTCHA"
                        value={captcha}
                        onChange={(e) => setCaptcha(e.target.value)}
                        theme={customInputTheme}
                        color="gray"
                        required
                      />
                    </div>
                  )}

                  <Button className="h-10" color="success" type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <Spinner size="sm" />
                        <span className="pl-3">Loading...</span>
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                  <OAuth />
                </form>
                <div className="flex justify-between mt-2">
                  <Link to="/sign-up" className="text-green-500 text-sm">
                    Don’t have an account? Sign Up
                  </Link>
                  <button
                    className="text-green-500 text-sm underline hover:no-underline"
                    onClick={() => {
                      setForgotStep(1);
                      setForgotEmail("");
                      setOtp("");
                      setNewPassword("");
                      setConfirmPassword("");
                    }}
                  >
                    Forgot Password?
                  </button>
                </div>
              </div>
            </>
          )}

          {/* OTP VERIFY FORM */}
          {forgotStep === 0 && signinStep === 1 && (
            <>
              <h1 className="text-center text-2xl font-bold mb-7">Enter OTP</h1>
              <div className="border rounded-lg p-4 bg-white-500 space-y-4">
                <TextInput
                  type="text"
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.trim())}
                  theme={customInputTheme}
                  color="gray"
                  required
                />
                <Button
                  onClick={handleVerifyOTP}
                  color="success"
                  disabled={otpLoading}
                  className="w-full"
                >
                  {otpLoading ? <Spinner size="sm" /> : "Verify OTP"}
                </Button>
                <button
                  className="text-green-500 text-sm underline hover:no-underline"
                  onClick={() => {
                    setSigninStep(0);
                    setOtp("");
                    setUserId(null);
                    fetchCaptcha();
                  }}
                >
                  Back to Sign In
                </button>
              </div>
            </>
          )}

          {/* FORGOT PASSWORD FLOW */}
          {forgotStep === 1 && (
            <>
              <h1 className="text-center text-2xl font-bold mb-7">Reset Password</h1>
              <div className="border rounded-lg p-4 bg-white-500 space-y-4">
                {!otp && (
                  <>
                    <TextInput
                      type="email"
                      placeholder="Enter your email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value.trim())}
                      theme={customInputTheme}
                      color="gray"
                      required
                    />
                    <Button
                      onClick={handleForgotRequest}
                      color="success"
                      disabled={forgotLoading}
                      className="w-full"
                    >
                      {forgotLoading ? <Spinner size="sm" /> : "Send OTP"}
                    </Button>
                  </>
                )}

                {(otp !== "" || forgotLoading === false) && (
                  <>
                    <TextInput
                      type="text"
                      placeholder="Enter OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.trim())}
                      theme={customInputTheme}
                      color="gray"
                      required
                    />
                    <TextInput
                      type="password"
                      placeholder="New Password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      theme={customInputTheme}
                      color="gray"
                      required
                    />
                    <TextInput
                      type="password"
                      placeholder="Confirm New Password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      theme={customInputTheme}
                      color="gray"
                      required
                    />
                    <Button
                      onClick={handleResetPassword}
                      color="success"
                      disabled={forgotLoading}
                      className="w-full"
                    >
                      {forgotLoading ? <Spinner size="sm" /> : "Reset Password"}
                    </Button>
                  </>
                )}
              </div>
            </>
          )}

          {forgotStep === 2 && (
            <div className="border rounded-lg p-4 bg-white-500 text-center">
              <h2 className="text-green-600 font-bold text-lg mb-4">Password Reset Successful!</h2>
              <Button onClick={() => setForgotStep(0)} color="success" className="w-full">
                Back to Sign In
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
