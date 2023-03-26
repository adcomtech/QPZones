import express from "express";
import cors from "cors";
import fileUpload from "express-fileupload";
import cookieParser from "cookie-parser";
// import path from "path";
// import { fileURLToPath } from "url";

import HandleAppErrors from "./utils/handleAppError.js";
import globalAppErrorHandler from "./middlewares/globalAppErrorHandler.js";
import { corsOptions } from "./middlewares/corsOptions.js";

import { userRouter } from "./routes/userRoutes.js";
import { topicRouter } from "./routes/topicRoutes.js";
import { deptRouter } from "./routes/deptRoutes.js";
import { reviewRouter } from "./routes/reviewRoutes.js";
import { emailMsgRouter } from "./routes/emailMsgRoutes.js";
import { orderRouter } from "./routes/orderRoutes.js";

/**************************************************
///  APPLICATION INITIALIZATION
 **************************************************/
export const app = express();

/**************************************************
///  MIDDLEWARE STACK
 **************************************************/
// Allows for Cross Origin Access
app.use(cors(corsOptions));

// Allows express to parse json Data
app.use(express.json());

// Allows for cookie access on the header
app.use(cookieParser());

app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// const __filename = fileURLToPath(import.meta.url);

// const __dirname = path.dirname(__filename);

// app.use(express.static(__dirname + "/public"));
// app.use("/uploads", express.static("uploads"));

// Allows express to Accept Impage Upload
app.use(fileUpload({ useTempFiles: true }));

/**************************************************
///  MOUNTING ROUTES FOR THE API
 **************************************************/
app.use("/api/v1/users", userRouter);
app.use("/api/v1/topics", topicRouter);
app.use("/api/v1/departments", deptRouter);
app.use("/api/v1/reviews", reviewRouter);
app.use("/api/v1/emails", emailMsgRouter);
app.use("/api/v1/orders", orderRouter);

/**************************************************
///  HANDLING ERRORS FOR THE API
 **************************************************/
// Handle Route Not Found Error
app.all("*", (req, res, next) => {
  next(
    new HandleAppErrors(`Can't Find ${req.originalUrl} on this Server`, 404)
  );
});

// Catching Global Errors
app.use(globalAppErrorHandler);
