import { promisify } from "util";
import jwt from "jsonwebtoken";

import { User } from "../models/UserModel.js";
import { catchAsyncErrors } from "../utils/catchAsyncErrors.js";
import HandleAppErrors from "../utils/handleAppError.js";

export const authProtectRoute = catchAsyncErrors(async (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader?.startsWith("Bearer "))
    return next(
      new HandleAppErrors("Unauthorized, Please Login to get Access", 401)
    );

  const token = authHeader.split(" ")[1];

  // console.log(token);

  // verification of token
  // const decoded = await promisify(jwt.verify)(
  //   token,
  //   process.env.JWT_ACCESS_TOKEN_SECRET
  // ); // this function needs to be promisified using util module

  jwt.verify(
    token,
    process.env.JWT_ACCESS_TOKEN_SECRET,
    async (err, decoded) => {
      if (err)
        return next(new HandleAppErrors("Forbidden! Invalid Token Found", 403));

      const user = await User.findById(decoded.id);

      if (!user || user.refreshToken === "")
        return next(
          new HandleAppErrors("User for this Token does no Longer Exist", 401)
        );

      // Check if User Changed Password
      if (user.changedPasswordAfter(decoded.iat))
        return next(
          new HandleAppErrors(
            "User Recently Changed Password, Please Login Again to Get Access",
            401
          )
        );
      // console.log(user);
      req.user = user;
      // req.roles = decoded.UserInfo.roles;
      next();
    }
  );

  // // checking if user still exist
  // const user = await User.findById(decoded.id);
  // if (!user) {
  //   return next(
  //     new HandleAppErrors("The User for this Token does no longer exist", 401)
  //   );
  // }
  // // checking if user changed his password after the jwt has been sent
  // // calling the instance method created in the usermodel for checking if password has been changed on the current user
  // if (user.changedPasswordAfter(decoded.iat)) {
  //   return next(
  //     new HandleAppErrors(
  //       "User recently changed password! Please login again",
  //       401
  //     )
  //   );
  // }

  // req.user = user;

  // next();
});
