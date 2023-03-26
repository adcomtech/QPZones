import dotenv from "dotenv";
import morgan from "morgan";
import cloudinary from "cloudinary";

import { app } from "./app.js";
import { dbConnectLocal } from "./config/dbConnection.js";

// Environment Variable Configuration
dotenv.config();

// DataBase Connection
dbConnectLocal();

// Cloudinary Config for Image Upload
// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_SECRET_KEY,
// });

// Logging Middle
const nodeEnv = process.env.NODE_ENV;
console.log(nodeEnv);
if (nodeEnv === "development") app.use(morgan("dev"));

// Creating the Server
const port = process.env.PORT || 8030;
const server = app.listen(port, () => {
  console.log(`Pzone App is Up and Running on Port http://127.0.0.1:${port}`);
});

// Handling UnhandledRejection
process.on("unhandledRejection", (error) => {
  console.log("Server Shutting Down For Error: " + error.message);
  console.log("Server Shutting Due to Unhandled Promise Rejection");

  server.close(() => process.exit(1));
});
