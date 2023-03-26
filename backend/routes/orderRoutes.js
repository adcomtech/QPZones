import express from "express";
import {
  createNewOrder,
  deleteOrder,
  getAllOrders,
  getAllUserOrders,
  getIncomeStats,
  getLatestOrders,
  getOrdersStats,
  getUserSingleOrder,
  getWeeklySalesStats,
  updateOrderStatus,
} from "../controllers/orderController.js";

import { authProtectRoute } from "../middlewares/authProtechRoute.js";
import { authRestrictRoute } from "../middlewares/authRestrictRoute.js";

const router = express.Router();

// Protect All Routes
router.use(authProtectRoute);

router.route("/new").post(createNewOrder);

router.route("/user/:id").get(getUserSingleOrder);

router.route("/user/orders").get(getAllUserOrders);

// Restrict Routes Only of Admins
router.use(authRestrictRoute("admin"));

router.route("/").get(getAllOrders);

router.route("/:id").patch(updateOrderStatus).delete(deleteOrder);

router.route("/stats").get(getOrdersStats);

router.route("/income-stats").get(getIncomeStats);

router.route("/weekly-sales-stats").get(getWeeklySalesStats);

router.route("/latest-orders").get(getLatestOrders);

export const orderRouter = router;
