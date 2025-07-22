export const isPasswordExpired = (passwordChangedAt) => {
  const expiryDays = 90; // or 1 for testing
  const expiryTime = expiryDays * 24 * 60 * 60 * 1000; // ms

  return Date.now() - new Date(passwordChangedAt).getTime() > expiryTime;
};
