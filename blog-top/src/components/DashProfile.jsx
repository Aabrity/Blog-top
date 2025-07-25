
"use client";

import { Button, Modal, TextInput } from "flowbite-react";
import { useEffect, useRef, useState } from "react";
import { CircularProgressbar } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { toast, Toaster } from "react-hot-toast";

import { HiCamera, HiLockClosed, HiMail, HiUser } from "react-icons/hi";
import { useDispatch, useSelector } from "react-redux";
import {
    deleteUserFailure,
    deleteUserStart,
    deleteUserSuccess,
    signoutSuccess,
    updateFailure,
    updateStart,
    updateSuccess,
} from "../redux/user/userSlice";

const customStyles = `
  .flowbite-button[data-testid="flowbite-button"] {
    border: none !important;
    padding: 0.375rem 0.75rem !important;
    font-size: 0.875rem !important;
  }
  .flowbite-textinput input {
    padding: 0.375rem 0.75rem !important;
    font-size: 0.875rem !important;
  }
  .flowbite-textinput input:focus {
    border-color: #205431ff !important;
    box-shadow: 0 0 0 1px #205431ff !important;
  }
`;

export default function DashProfile() {
  const { currentUser, error, loading } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const filePickerRef = useRef();
  useEffect(() => {
    fetchCSRFToken();
  }, []);

  const [imageBase64, setImageBase64] = useState(null);
  const [imageFileUploadProgress, setImageFileUploadProgress] = useState(null);
  const [imageFileUploading, setImageFileUploading] = useState(false);
  const [formData, setFormData] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [csrfToken, setCsrfToken] = useState("");

  // EMAIL CHANGE STATES
  const [emailChangeStep, setEmailChangeStep] = useState(0); 
  const [newEmail, setNewEmail] = useState("");
  const [emailOtp, setEmailOtp] = useState("");

  // Password strength state
  const [passwordStrength, setPasswordStrength] = useState(null);

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be less than 2MB");
      return;
    }

    setImageFileUploading(true);
    setImageFileUploadProgress(10);

    const formData = new FormData();
    formData.append("profilePicture", file);

    try {
      const res = await fetch(`/api/user/profile-picture/${currentUser._id}`, {
        method: "PUT",
        body: formData,
         headers: { "CSRF-Token": csrfToken },
        credentials: "include",
      });

      const data = await res.json();
      setImageFileUploadProgress(100);
      setImageFileUploading(false);

      if (!res.ok) {
        toast.error(data.message || "Failed to upload image");
      } else {
        toast.success("Profile picture uploaded!");
        dispatch(updateSuccess(data.user));
      }
    } catch (error) {
      toast.error("Upload failed: " + error.message);
      setImageFileUploading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  // Custom password strength checker without external lib
  const evaluatePasswordStrength = (password) => {
    let score = 0;
    if (!password) return null;

    // length check
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;

    // has uppercase
    if (/[A-Z]/.test(password)) score++;

    // has number
    if (/\d/.test(password)) score++;

    // has special char
    if (/[^A-Za-z0-9]/.test(password)) score++;

    // score max = 5
    if (score <= 2) return { label: "Weak", color: "text-green-600" };
    if (score === 3 || score === 4) return { label: "Medium", color: "text-yellow-600" };
    if (score === 5) return { label: "Strong", color: "text-green-600" };
  };

  const handlePasswordChange = (e) => {
    handleChange(e);
    const pwd = e.target.value;
    const strength = evaluatePasswordStrength(pwd);
    setPasswordStrength(strength);
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Exclude email from main update submit (email update done via separate flow)
    const { email, ...profileUpdates } = formData;

    if (Object.keys(profileUpdates).length === 0) {
      toast.error("No changes made");
      return;
    }
    if (imageFileUploading) {
      toast.error("Wait for image upload to complete");
      return;
    }

    try {
      dispatch(updateStart());
      const res = await fetch(`/api/user/update/${currentUser._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "CSRF-Token": csrfToken },
        body: JSON.stringify(profileUpdates),
      });
      const data = await res.json();

      if (!res.ok) {
        dispatch(updateFailure(data.message));
        toast.error(data.message || "Failed to update profile");
      } else {
        dispatch(updateSuccess(data));
        toast.success("Profile updated successfully");
      }
    } catch (error) {
      dispatch(updateFailure(error.message));
      toast.error("Update failed: " + error.message);
    }
  };

  const handleDeleteUser = async () => {
    setShowModal(false);
    try {
      dispatch(deleteUserStart());
      const res = await fetch(`/api/user/delete/${currentUser._id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok) {
        dispatch(deleteUserFailure(data.message));
        toast.error(data.message || "Failed to delete account");
      } else {
        dispatch(deleteUserSuccess(data));
        toast.success("Account deleted successfully");
      }
    } catch (error) {
      dispatch(deleteUserFailure(error.message));
      toast.error("Deletion failed: " + error.message);
    }
  };

  const handleSignout = async () => {
    try {
      const res = await fetch("/api/user/signout", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        //console.log(data.message);
      } else {
        dispatch(signoutSuccess());
      }
    } catch (error) {
      //console.log(error.message);
    }
  };

  // === EMAIL CHANGE FUNCTIONS ===

  const requestEmailChange = async () => {
    if (!newEmail) {
      toast.error("Please enter a new email");
      return;
    }

    try {
      const res = await fetch(`/api/user/${currentUser._id}/request-email-change`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "CSRF-Token": csrfToken },
        body: JSON.stringify({ email: newEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Failed to request email change");
      } else {
        toast.success(data.message);
        setEmailChangeStep(1);
      }
    } catch (err) {
      toast.error("Error: " + err.message);
    }
  };

  const confirmEmailChange = async () => {
    if (!emailOtp) {
      toast.error("Please enter the OTP");
      return;
    }

    try {
      const res = await fetch(`/api/user/${currentUser._id}/confirm-email-change`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "CSRF-Token": csrfToken },
        body: JSON.stringify({ otp: emailOtp }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Failed to confirm email change");
      } else {
        toast.success(data.message);
        setEmailChangeStep(2);

        // Update Redux user state with new email from backend response
        if (data.user) {
          dispatch(updateSuccess(data.user));
        } else {
          // If backend does not return user, you can at least update email locally:
          dispatch(updateSuccess({ ...currentUser, email: newEmail }));
        }

        // Optionally reset input fields
        setEmailOtp("");
        setNewEmail("");
      }
    } catch (err) {
      toast.error("Error: " + err.message);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-3 w-full">
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />
      <div className="max-w-md mx-auto px-3">
        <div className="text-center mb-3">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Profile</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">Manage your account</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gray-400 px-4 py-3">
            <div className="flex flex-col items-center">
              <input type="file" accept="image/*" onChange={handleImageChange} ref={filePickerRef} hidden />
              <div className="relative group">
                <div
                  className="relative w-16 h-16 cursor-pointer overflow-hidden rounded-full ring-2 ring-white shadow-lg transition-transform duration-300 group-hover:scale-105"
                  onClick={() => filePickerRef.current.click()}
                >
                  {imageFileUploadProgress && (
                    <CircularProgressbar
                      value={imageFileUploadProgress || 0}
                      text={`${imageFileUploadProgress}%`}
                      strokeWidth={6}
                      styles={{
                        root: { width: "100%", height: "100%", position: "absolute", top: 0, left: 0, zIndex: 10 },
                        path: { stroke: `rgba(239, 68, 68, ${imageFileUploadProgress / 100})` },
                        text: { fill: "white", fontSize: "14px", fontWeight: "bold" },
                      }}
                    />
                  )}
                  <img
                    src={imageBase64 || `/uploads/${currentUser.profilePicture}`}
                    alt="Profile"
                    className={`w-full h-full object-cover ${
                      imageFileUploadProgress && imageFileUploadProgress < 100 && "opacity-60"
                    }`}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                    <HiCamera className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                </div>
              </div>
              <div className="mt-2 text-center">
                <h2 className="text-lg font-semibold text-white">{currentUser.username}</h2>
                <p className="text-sm text-green-100">{currentUser.email}</p>
                {currentUser.isAdmin && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 bg-opacity-90 text-green-800 mt-1">
                    Admin
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="p-3">
            <form onSubmit={handleSubmit} className="space-y-2">
              <div className="grid gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                    <HiUser className="w-3 h-3" />
                    Username
                  </label>
                  <TextInput
                    type="text"
                    id="username"
                    placeholder="Enter your username"
                    defaultValue={currentUser.username}
                    onChange={handleChange}
                    size="sm"
                  />
                </div>

                {/* KEEP EMAIL INPUT FOR DISPLAY + NEW EMAIL IS HANDLED BELOW */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                    <HiMail className="w-3 h-3" />
                    Email
                  </label>
                  <TextInput
                    type="email"
                    id="email"
                    placeholder={currentUser.email}
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    size="sm"
                  />
                </div>

                {/* EMAIL CHANGE UI */}
                {emailChangeStep === 0 && (
                  <Button  className="mt-2 bg-green-600 hover:bg-green-700 text-white" size="sm" onClick={requestEmailChange} disabled={!newEmail}>
                    Request Email Change
                  </Button>
                )}
                {emailChangeStep === 1 && (
                  <>
                    <TextInput
                      type="text"
                      placeholder="Enter OTP"
                      value={emailOtp}
                      maxLength={6}
                      onChange={(e) => setEmailOtp(e.target.value)}
                      size="sm"
                      className="mt-2"
                    />
                    <Button
                      size="sm"
                      onClick={confirmEmailChange}
                      disabled={emailOtp.length !== 6}
                       className="mt-2 bg-green-600 hover:bg-green-700 text-white"
                    >
                      Confirm Email Change
                    </Button>
                  </>
                )}
                {emailChangeStep === 2 && (
                  <p className="text-green-600 text-xs mt-1">Email successfully updated!</p>
                )}

                <div className="space-y-1 mt-3">
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                    <HiLockClosed className="w-3 h-3" />
                    Current Password
                  </label>
                  <TextInput
                    type="password"
                    id="currentPassword"
                    placeholder="Enter current password"
                    onChange={handleChange}
                    size="sm"
                    required={!!formData.password}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                    <HiLockClosed className="w-3 h-3" />
                    New Password
                  </label>
                  <TextInput
                    type="password"
                    id="password"
                    placeholder="New password (optional)"
                    onChange={handlePasswordChange}
                    size="sm"
                  />
                  {passwordStrength && (
                    <p className={`text-xs mt-1 font-semibold ${passwordStrength.color}`}>
                      Password Strength: {passwordStrength.label}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <Button
                  type="submit"
                  color="success"
                  size="sm"
                  disabled={loading || imageFileUploading}
                  className="w-full"
                >
                  {loading ? "Updating..." : "Update"}
                </Button>
              </div>
            </form>

            <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowModal(true)}
                className="text-xs text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 font-medium transition-colors duration-200"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>

        <Modal show={showModal} onClose={() => setShowModal(false)}>
          <Modal.Header>Confirm Delete</Modal.Header>
          <Modal.Body>
            <p>Are you sure you want to delete your account? This action cannot be undone.</p>
          </Modal.Body>
          <Modal.Footer>
            <Button color="gray" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button color="success" onClick={handleDeleteUser}>
              Delete
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </div>
  );
}
