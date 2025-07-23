
import { Button, Spinner, TextInput } from "flowbite-react";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import OAuth from "../components/OAuth";
import comunity from "../assets/comunity.png";
import toast from "react-hot-toast";

export default function SignUp() {
  // Password strength calculator
  function calculatePasswordStrength(password) {
    let score = 0;
    if (!password) return score;

    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[@$!%*?&]/.test(password)) score += 1;

    return score; // max 6
  }

  // Password strength meter component
  function PasswordStrengthMeter({ strength }) {
    const strengthLabels = ["Very Weak", "Weak", "Fair", "Good", "Strong", "Very Strong"];
    const colors = ["#d9534f", "#f0ad4e", "#f7b731", "#5bc0de", "#5cb85c", "#428bca"];

    const normalizedStrength = Math.min(strength, strengthLabels.length - 1);

    return (
      <div>
        <div
          style={{
            height: "3px",               // smaller height
            width: `${(strength / 6) * 100}%`,
            backgroundColor: colors[normalizedStrength],
            transition: "width 0.3s ease-in-out",
            borderRadius: "3px",
          }}
        />
        <p
          style={{
            color: colors[normalizedStrength],
            fontWeight: "600",
            fontSize: "0.75rem",       // smaller font
            marginTop: "1px",          // less margin
            marginBottom: 0,
            lineHeight: 1,
          }}
        >
          {strengthLabels[normalizedStrength]}
        </p>
      </div>
    );
  }

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    captcha: "",
  });
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false); // Added focus state
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("signup");
  const [loading, setLoading] = useState(false);
  const [captchaSVG, setCaptchaSVG] = useState("");
  const [csrfToken, setCsrfToken] = useState("");
  const navigate = useNavigate();

  // Fetch CAPTCHA & CSRF only during signup step
  useEffect(() => {
    if (step === "signup") {
      fetchCaptcha();
      fetchCSRFToken();
    }
  }, [step]);

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
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value.trim() }));

    if (id === "password") {
      setPasswordStrength(calculatePasswordStrength(value));
    }
  };

  const handleOtpChange = (e) => {
    setOtp(e.target.value.trim());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (step === "signup") {
      const { username, email, password, confirmPassword, captcha } = formData;

      if (!username || !email || !password || !confirmPassword || !captcha) {
        return toast.error("Please fill out all fields including CAPTCHA.");
      }

      if (password !== confirmPassword) {
        return toast.error("Passwords do not match.");
      }

      if (password.length < 8) {
        return toast.error("Password must be at least 8 characters long.");
      }

      try {
        setLoading(true);
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Content-Type-Options": "nosniff",
            "CSRF-Token": csrfToken,
          },
          credentials: "include",
          body: JSON.stringify({ username, email, password, captcha }),
        });

        const data = await res.json();
        setLoading(false);

        if (!res.ok || data.success === false) {
          fetchCaptcha(); // Refresh CAPTCHA on failure
          return toast.error(data.message || "Registration failed.");
        }

        toast.success("Signup successful! Please verify your email.");
        setStep("verifyOtp");
      } catch (error) {
        setLoading(false);
        fetchCaptcha(); // Refresh CAPTCHA on error
        toast.error("Something went wrong. Please try again later.");
      }
    } else if (step === "verifyOtp") {
      try {
        setLoading(true);
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json", "CSRF-Token": csrfToken },
          body: JSON.stringify({ email: formData.email, otp }),
        });

        const data = await res.json();
        setLoading(false);

        if (!res.ok || data.success === false) {
          return toast.error(data.message || "OTP verification failed.");
        }

        toast.success("Email verified! You can now sign in.");
        navigate("/sign-in");
      } catch (error) {
        setLoading(false);
        toast.error("Something went wrong during OTP verification.");
      }
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
        {/* Left Side */}
        <div className="w-full md:w-5/7 relative">
          <div className="bg-white rounded-lg p-2 z-0 relative">
            <img
              src={comunity || "/placeholder.svg"}
              alt="Community illustration"
              className="w-full h-auto object-cover rounded-lg mb-0"
            />
            <div className="bg-offwhite rounded-lg shadow-md p-4 -mt-10 relative z-10">
              <p className="text-xsm text-gray-600 space-y-3">
                BlogTop is like a big neighborhood notice board with a map...
              </p>
            </div>
          </div>
        </div>

        {/* Right Side */}
        <div className="w-full mt-12 md:w-1/2">
          <h1 className="text-center text-2xl font-bold mb-7">
            {step === "signup" ? "SIGN UP" : "VERIFY YOUR EMAIL"}
          </h1>
          <div className="border rounded-lg p-2 bg-white-500">
            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              {step === "signup" ? (
                <>
                  <TextInput
                    type="text"
                    placeholder="Username"
                    id="username"
                    onChange={handleChange}
                    value={formData.username}
                    theme={customInputTheme}
                    color="gray"
                    required
                  />
                  <TextInput
                    type="email"
                    placeholder="name@company.com"
                    id="email"
                    onChange={handleChange}
                    value={formData.email}
                    theme={customInputTheme}
                    color="gray"
                    required
                  />
                  <TextInput
                    type="password"
                    placeholder="Password"
                    id="password"
                    onChange={handleChange}
                    value={formData.password}
                    onFocus={() => setIsPasswordFocused(true)}  // show strength only when focused
                    onBlur={() => setIsPasswordFocused(false)}
                    theme={customInputTheme}
                    color="gray"
                    required
                  />
                  {/* Password strength meter, only when focused and has input */}
                  {isPasswordFocused && formData.password.length > 0 && (
                    <div className="mt-1 mb-3">
                      <PasswordStrengthMeter strength={passwordStrength} />
                    </div>
                  )}
                  <TextInput
                    type="password"
                    placeholder="Confirm Password"
                    id="confirmPassword"
                    onChange={handleChange}
                    value={formData.confirmPassword}
                    theme={customInputTheme}
                    color="gray"
                    required
                  />
                  {/* CAPTCHA */}
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
                        value={formData.captcha}
                        onChange={handleChange}
                        theme={customInputTheme}
                        color="gray"
                        required
                      />
                    </div>
                  )}
                </>
              ) : (
                <>
                  <p className="text-center mb-4 text-gray-700">
                    We sent an OTP to your email: <strong>{formData.email}</strong>. Please enter it below to
                    verify your account.
                  </p>
                  <TextInput
                    type="text"
                    placeholder="Enter OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.trim())}
                    theme={customInputTheme}
                    color="gray"
                    required
                  />
                </>
              )}

              <Button className="h-10" color="success" type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Spinner size="sm" />
                    <span className="pl-3">
                      {step === "signup" ? "Signing up..." : "Verifying..."}
                    </span>
                  </>
                ) : step === "signup" ? (
                  "Sign Up"
                ) : (
                  "Verify OTP"
                )}
              </Button>
              {step === "signup" && <OAuth />}
            </form>
            {step === "signup" && (
              <div className="flex gap-2 text-sm mt-3">
                <span>Have an account?</span>
                <Link to="/sign-in" className="text-green-500">
                  Sign In
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
