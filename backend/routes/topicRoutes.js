import express from "express";

import {
  createNewTopic,
  deleteTopic,
  disLikeTopic,
  getAllTopics,
  getTopicDetails,
  likeTopic,
  updateTopic,
} from "../controllers/topicsController.js";
import { authProtectRoute } from "../middlewares/authProtechRoute.js";
import { authRestrictRoute } from "../middlewares/authRestrictRoute.js";
import { reviewRouter } from "./reviewRoutes.js";

const router = express.Router();

// PROPER WAY OF CREATING A REVIEW USING A NESTED ROUTE
router.use("/:topicId/reviews", reviewRouter);

router.route("/lists").get(getAllTopics);
router.route("/details/:id").get(getTopicDetails);

router.use(authProtectRoute);

router.route("/like-topic").patch(likeTopic);
router.route("/dislike-topic").patch(disLikeTopic);

router.route("/new").post(authRestrictRoute("Admin", "Seller"), createNewTopic);
router
  .route("/update/:id")
  .put(authRestrictRoute("Admin", "Seller"), updateTopic);
router.route("/delete/:id").delete(authRestrictRoute("Admin"), deleteTopic);

export const topicRouter = router;
