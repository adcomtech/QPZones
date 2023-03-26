import HandleAppErrors from "../utils/handleAppError.js";

export const authRestrictRoute = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new HandleAppErrors(
          `User with the Role of ${req.user.role} Do not have the Permission to Access this Resource!`,
          401
        )
      );
    }
    next();
  };
};
