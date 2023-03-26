import express from "express";
import {
  accountVerification,
  createNewUser,
  deleteMe,
  forgotPassword,
  getAccountVerifyToken,
  getLoggedInUserData,
  getUserRefreshToken,
  resetPassword,
  updateUerProfile,
  updateUserPassword,
  userLogin,
  userLogout,
} from "../controllers/authController.js";
import {
  activateSeller,
  createNewSeller,
  deleteUser,
  getAllUsers,
  getSellers,
  getTopSellers,
  getUserDetails,
  getUsersStats,
  unFollowUser,
  updateUserRole,
  updateUserToSeller,
  userFollowing,
} from "../controllers/usersController.js";
import { authProtectRoute } from "../middlewares/authProtechRoute.js";
import { authRestrictRoute } from "../middlewares/authRestrictRoute.js";
// import { profileUpload } from "../utils/fileUpload.js";

const router = express.Router();

router.route("/new").post(createNewUser);
router.route("/seller/new").post(createNewSeller);
router.route("/seller/activation").post(activateSeller);
router.route("/seller/top-sellers").get(getTopSellers);
router.route("/login").post(userLogin);
router.route("/logout").post(userLogout);
router.route("/password/forgot").post(forgotPassword);
router.route("/password/reset/:token").patch(resetPassword);
router.route("/refresh-token").get(getUserRefreshToken);

router.use(authProtectRoute);

router.route("/account/verify").post(getAccountVerifyToken);
router.route("/account/verify/:token").patch(accountVerification);
router.route("/account").get(getLoggedInUserData);
router.route("/account/update/profile").patch(updateUerProfile);
router.route("/account/update/password").patch(updateUserPassword);
router.route("/account/delete").delete(deleteMe);
router.route("/seller/update").put(updateUserToSeller);
router.route("/follow-user").patch(userFollowing);
router.route("/unfollow-user").patch(unFollowUser);

router.use(authRestrictRoute("Admin"));

router.route("/admin/lists").get(getAllUsers);
router.route("/admin/sellers").get(getSellers);
router.route("/admin/details/:id").get(getUserDetails);
router.route("/admin/update-user/:id").put(updateUserRole);
router.route("/admin/delete-user/:id").delete(deleteUser);
router.route("/admin/block-user/:id").delete(deleteUser);
router.route("/admin/unblock-user/:id").delete(deleteUser);
router.route("/admin/users-statistics").get(getUsersStats);

export const userRouter = router;
