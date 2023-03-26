import express from "express";
import {
  createEmailMsg,
  deleteEmail,
  getAllEmail,
  getEmail,
} from "../controllers/emialMsgController.js";
import { authProtectRoute } from "../middlewares/authProtechRoute.js";

const router = express.Router();

router.use(authProtectRoute);

router.route("/").post(createEmailMsg).get(getAllEmail);

router.route("/:id").get(getEmail).delete(deleteEmail);

export const emailMsgRouter = router;
