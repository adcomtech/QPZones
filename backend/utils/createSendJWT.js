import { catchAsyncErrors } from "./catchAsyncErrors.js";

export const sendJwtAcessAndRefreshToken = catchAsyncErrors(
  async (user, statusCode, res) => {
    // Get the Instance Methods that Creates Access and Refresh Token
    const accessToken = user.getJWTAccessToken();
    const refreshToken = user.getJWTRefreshToken();
    // console.log(accessToken, refreshToken);

    // Saving refreshToken with current user
    user.refreshToken = refreshToken;
    const result = await user.save();

    // Send Cookie Options
    const cookieOptions = {
      expires: new Date(
        Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
      ),
      httpOnly: true,
    };

    if (process.env.NODE_ENV === "production") cookieOptions.secure = true;

    res.cookie("jwt", refreshToken, cookieOptions);

    // removing the password from the output
    user.password = undefined;

    res.status(statusCode).json({
      status: "success",
      user,
      accessToken,
    });
  }
);
