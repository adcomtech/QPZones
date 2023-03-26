import express from "express";
import {
  createDepartment,
  deleteDepartment,
  getAllDepartments,
  getDeptDetails,
  updateDepartment,
} from "../controllers/deptController.js";
import { authProtectRoute } from "../middlewares/authProtechRoute.js";
import { authRestrictRoute } from "../middlewares/authRestrictRoute.js";

const router = express.Router();

// // Implementing Nexted Routes on the Topics to Enable access of topics on departments
// router.use('/:slug/topics', topicRouter);

router.get("/lists", getAllDepartments);

router.get("/:id", getDeptDetails);

router.post(
  "/new",
  authProtectRoute,
  authRestrictRoute("Admin"),
  createDepartment
);

router.patch(
  "/:id",
  authProtectRoute,
  authRestrictRoute("Admin"),
  updateDepartment
);

router.delete(
  "/:id",
  authProtectRoute,
  authRestrictRoute("Admin"),
  deleteDepartment
);

export const deptRouter = router;
