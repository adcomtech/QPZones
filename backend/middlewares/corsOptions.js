import { siteOrigins } from "../config/allowedOrigins.js";

export const corsOptions = {
  origin: (origin, callBack) => {
    if (siteOrigins.indexOf(origin) !== -1 || !origin) {
      callBack(null, true);
    } else {
      callBack(new Error("The Host you are Accessing is not Allowed"));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};
