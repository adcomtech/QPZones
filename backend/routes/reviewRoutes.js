import express from "express";
import {
  createNewReview,
  deleteReview,
  getAllReviews,
  updateReview,
} from "../controllers/reviewController.js";
import { authProtectRoute } from "../middlewares/authProtechRoute.js";
import { authRestrictRoute } from "../middlewares/authRestrictRoute.js";

// mergeparams set to true is use to get access to other parameter in a different route
const router = express.Router({ mergeParams: true });
// const router = express.Router();

router.use(authProtectRoute);

router.route("/new").post(authRestrictRoute("User"), createNewReview);

router.route("/").get(getAllReviews);

router
  .route("/:id")
  .patch(authRestrictRoute("User", "Admin"), updateReview)
  .delete(authRestrictRoute("User", "Admin"), deleteReview);

export const reviewRouter = router;
