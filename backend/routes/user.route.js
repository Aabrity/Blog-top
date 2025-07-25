
// import express from 'express';
// import rateLimit from 'express-rate-limit';
// // import { authMiddleware } from '../utils/auth.js';
// import {
//   deleteUser,
//   getUser,
//   getUsers,
//   signout,
//   updateUser,
//   updateUserProfilePicture,
//   getUserPublicInfo,
//   requestEmailChange,
//   confirmEmailChange,
  
// } from '../controllers/user.controller.js';

// import { checkPasswordExpiry } from '../utils/checkPasswordExpiry.js'; // ✅ NEW
// import { upload } from '../utils/fileUpload.js';
// import { isAdmin, isAdminOrSelf } from '../utils/verifyRoles.js';
// import { verifyToken } from '../utils/verifyUser.js';
// import User from '../models/user.model.js';

// const router = express.Router();

// // Rate limiter for update/delete operations
// const modifyLimiter = rateLimit({
//   windowMs: 10 * 60 * 1000, // 10 mins
//   max: 10,
//   message: 'Too many requests from this IP, please try again later.',
// });

// // 🔒 UPDATE USER — requires token, expiry check, ownership/admin, and rate limit
// router.put(
//   '/update/:userId',
//   verifyToken,
//   checkPasswordExpiry, 
//   isAdminOrSelf,
//   modifyLimiter,
//   updateUser
// );
// router.get('/subscription-status', verifyToken, async (req, res) => {
//   try {
//     const user = await User.findById(req.user.id);
//     if (!user) return res.status(404).json({ message: 'User not found' });

//     const now = new Date();
//     const isActive =
//       user.subscribed &&
//       user.subscriptionExpiresAt &&
//       user.subscriptionExpiresAt > now;

//     res.json({ isSubscribed: isActive });
//   } catch (error) {
//     console.error('Subscription status error:', error);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// });
// router.post('/:userId/request-email-change', requestEmailChange); // start email change
// router.post('/:userId/confirm-email-change', confirmEmailChange); // confirm OTP

// // 🔒 DELETE USER — same checks as update
// router.delete(
//   '/delete/:userId',
//   verifyToken,
//   checkPasswordExpiry,
//   isAdminOrSelf,
//   modifyLimiter,
//   deleteUser
// );

// // 🔐 SIGNOUT — token required but expiry check NOT needed
// router.post('/signout',  signout);

// // 📸 UPLOAD PROFILE PICTURE — secure + expiry protected
// router.put(
//   '/profile-picture/:userId',
//   verifyToken,
//   checkPasswordExpiry,
//   isAdminOrSelf,
//   upload.single('profilePicture'),
//   updateUserProfilePicture
// );

// // 👑 GET ALL USERS — admin only, must not be expired
// router.get('/getusers', verifyToken, checkPasswordExpiry, isAdmin, getUsers);

// // 👤 GET SINGLE USER BY ID — self or admin, must not be expired
// router.get('/:userId', verifyToken, checkPasswordExpiry, isAdminOrSelf, getUser);

// // Get public info of user by ID — any authenticated user can fetch commenter info
// router.get('/public/:userId', verifyToken, checkPasswordExpiry, getUserPublicInfo);


// export default router;
import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  deleteUser,
  getUser,
  getUsers,
  signout,
  updateUser,
  updateUserProfilePicture,
  getUserPublicInfo,
  requestEmailChange,
  confirmEmailChange,
} from '../controllers/user.controller.js';

import { checkPasswordExpiry } from '../utils/checkPasswordExpiry.js';
import { upload } from '../utils/fileUpload.js';
import { isAdmin, isAdminOrSelf } from '../utils/verifyRoles.js';
import { verifyToken } from '../utils/verifyUser.js';
import User from '../models/user.model.js';

const router = express.Router();

const modifyLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  message: 'Too many requests from this IP, please try again later.',
});

// 🔒 UPDATE USER
router.route('/update/:userId')
  .put(
    verifyToken,
    checkPasswordExpiry,
    isAdminOrSelf,
    modifyLimiter,
    updateUser
  )
  .all((req, res) => res.status(405).json({ message: 'Method Not Allowed' }));

// 🔐 SUBSCRIPTION STATUS
router.route('/subscription-status')
  .get(verifyToken, async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ message: 'User not found' });

      const now = new Date();
      const isActive =
        user.subscribed &&
        user.subscriptionExpiresAt &&
        user.subscriptionExpiresAt > now;

      res.json({ isSubscribed: isActive });
    } catch (error) {
      console.error('Subscription status error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  })
  .all((req, res) => res.status(405).json({ message: 'Method Not Allowed' }));

// ✉️ EMAIL CHANGE START
router.route('/:userId/request-email-change')
  .post(requestEmailChange)
  .all((req, res) => res.status(405).json({ message: 'Method Not Allowed' }));

// ✉️ EMAIL CHANGE CONFIRM
router.route('/:userId/confirm-email-change')
  .post(confirmEmailChange)
  .all((req, res) => res.status(405).json({ message: 'Method Not Allowed' }));

// 🔒 DELETE USER
router.route('/delete/:userId')
  .delete(
    verifyToken,
    checkPasswordExpiry,
    isAdminOrSelf,
    modifyLimiter,
    deleteUser
  )
  .all((req, res) => res.status(405).json({ message: 'Method Not Allowed' }));

// 🔐 SIGNOUT
router.route('/signout')
  .post(signout)
  .all((req, res) => res.status(405).json({ message: 'Method Not Allowed' }));

// 📸 UPLOAD PROFILE PICTURE
router.route('/profile-picture/:userId')
  .put(
    verifyToken,
    checkPasswordExpiry,
    isAdminOrSelf,
    upload.single('profilePicture'),
    updateUserProfilePicture
  )
  .all((req, res) => res.status(405).json({ message: 'Method Not Allowed' }));

// 👑 GET ALL USERS
router.route('/getusers')
  .get(verifyToken, checkPasswordExpiry, isAdmin, getUsers)
  .all((req, res) => res.status(405).json({ message: 'Method Not Allowed' }));

// 👤 GET SINGLE USER BY ID
router.route('/:userId')
  .get(verifyToken, checkPasswordExpiry, isAdminOrSelf, getUser)
  .all((req, res) => res.status(405).json({ message: 'Method Not Allowed' }));

// 🌐 GET PUBLIC USER INFO
router.route('/public/:userId')
  .get(verifyToken, checkPasswordExpiry, getUserPublicInfo)
  .all((req, res) => res.status(405).json({ message: 'Method Not Allowed' }));

export default router;
