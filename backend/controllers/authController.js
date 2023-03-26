import { v2 as cloudinary } from "cloudinary";
import jwt from "jsonwebtoken";
import crypto from "crypto";

import { User } from "../models/UserModel.js";
import { catchAsyncErrors } from "../utils/catchAsyncErrors.js";
import { sendJwtAcessAndRefreshToken } from "../utils/createSendJWT.js";
import { sendMail } from "../utils/eMail.js";
import HandleAppErrors from "../utils/handleAppError.js";
import { uploadFileToCloud } from "../utils/cloudinary.js";

/**************************************************
////*  SIGNING UP A NEW USER FUNCTIONALITY
 **************************************************/
export const createNewUser = catchAsyncErrors(async (req, res, next) => {
  const { name, email, password, confirmPassword } = req.body;
  // const { avatar } = req.files;

  // Check if User Already Exist
  const user = await User.findOne({ email: req.body.email });
  if (user) {
    return next(
      new HandleAppErrors("The Email Provided is Already Exist", 401)
    );
  }

  // Check Password Match
  if (req.body.password !== req.body.confirmPassword) {
    return next(new HandleAppErrors("The Password Do not Match", 400));
  }

  // Implement Cloudinary for Image Upload
  // const uploadAvatar = await uploadFileToCloud(avatar, {
  //   upload_preset: "QPzone_Users",
  //   public_id: `${avatar.name}`,
  //   resource_type: "image",
  //   width: 150,
  //   crop: "scale",
  // });

  const newUser = new User({
    name,
    email,
    password,
    confirmPassword,
    // avatar: uploadAvatar,
  });

  const userCreated = await newUser.save();

  res.status(201).json({
    status: "success",
    newUser: userCreated,
  });
});

/**************************************************
////*  SIGN IN USER FUNCTIONALITY
 **************************************************/
export const userLogin = catchAsyncErrors(async (req, res, next) => {
  // Destructure user login Credentials form user model
  const { email, password, phoneNumber } = req.body;

  // checking if email and password exist
  if (!email || !password) {
    return next(new HandleAppErrors("Provide email and password!", 400));
  }

  // if the user exist and password is correct
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return next(
      new HandleAppErrors("No User Found with this Email or Password", 401)
    );
  }

  // Check If User Input Password Match the User Password in the DB
  const isPasswordMatched = await user.comparePassword(password);
  if (!isPasswordMatched) {
    return next(
      new HandleAppErrors("No User Found with this Email or Password", 401)
    );
  }

  // Creating User with AccessToken and Refresh Token
  sendJwtAcessAndRefreshToken(user, 200, res);
});

/**************************************************
////*  GETTING A USER FRESHTOKEN FUNCTIONALITY
 **************************************************/
export const getUserRefreshToken = catchAsyncErrors(async (req, res, next) => {
  // Get the User Cookie from the Request
  const cookies = req.cookies;

  if (!cookies?.jwt)
    return next(
      new HandleAppErrors("Unauthorized, Please Login to get Access", 401)
    );

  // Assign Cooke from the Request to the RefreshToken to the
  const refreshToken = cookies?.jwt;

  // Checks if User Has the The RefreshToekm
  const user = await User.findOne({ refreshToken }).exec();

  // Return if the User has no Refresh Token
  if (!user)
    return next(
      new HandleAppErrors("Access Forbidden, Please Login to get Access", 401)
    );

  // Verify JWT
  jwt.verify(
    refreshToken,
    process.env.JWT_REFRESH_TOKEN_SECRET,
    async (err, decode) => {
      // Check if Users token expires when it not equal to the decoded data
      if (err || user.id !== decode.id)
        return next(new HandleAppErrors("Access Forbidden ", 403));

      // Send Access Token Again Using the Instance Method from Model
      const accessToken = user.getJWTAccessToken();

      res.status(200).json({
        status: "success",
        user,
        accessToken,
      });
    }
  );
});

/**************************************************
////*  USER lOG OUT FUNCTIONALITY
 **************************************************/
export const userLogout = catchAsyncErrors(async (req, res, next) => {
  // Get the Cookie
  const cookies = req.cookies;

  if (!cookies?.jwt)
    return next(new HandleAppErrors("Provide email and password!", 404)); //No content
  const refreshToken = cookies.jwt;

  // console.log(refreshToken);
  // Is refreshToken in db?
  const user = await User.findOne({ refreshToken }).exec();
  if (!user) {
    res.clearCookie("jwt", { httpOnly: true, sameSite: "None", secure: true });
    return next(new HandleAppErrors("Provide email and password!", 204));
  }

  // Delete refreshToken in db
  user.refreshToken = "";
  const result = await user.save();
  // console.log(result);

  res.clearCookie("jwt", { httpOnly: true, sameSite: "None", secure: true });

  res.status(200).json({
    status: "success",
    message: "Cookie Successfully Cleared",
  });
});

/**************************************************
////*  GET LOGGED IN USER DETAILS
 **************************************************/
export const getLoggedInUserData = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.user;
  // console.log(id);
  let userData;

  req.user.role === "User"
    ? (userData = await User.findById(id).select("-seller"))
    : (userData = await User.findById(id));

  if (!userData)
    return next(new HandleAppErrors("There is no User Found", 404));

  res.status(200).json({
    status: "success",
    userData,
  });
});

/**************************************************
////*  UPDATE USER PROFILE
 **************************************************/
export const updateUerProfile = catchAsyncErrors(async (req, res, next) => {
  const newUserData = {
    name: req.body.name,
    email: req.body.email,
  };

  const { avatar } = req.files;

  // Cloudinary Image Uplaod
  if (avatar !== "") {
    const user = await User.findById(req.user.id);

    // Delete Image From Cloudinary
    const imageId = user.avatar.public_id;
    await cloudinary.uploader.destroy(imageId);

    // Implement Cloudinary for Image Upload
    const uploadAvatar = await uploadFileToCloud(avatar, {
      upload_preset: "QPzone_Users",
      public_id: `${avatar.name}`,
      resource_type: "image",
      width: 150,
      crop: "scale",
    });
    // console.log(uploadAvatar);

    newUserData.avatar = {
      uploadAvatar,
    };
  }

  await User.findByIdAndUpdate(req.user.id, newUserData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({
    status: "success",
    message: "You have Successfully Updated Your Profile Data",
  });
});

/**************************************************
////*   UPDATE LOGGED IN USER PASSWORD
 **************************************************/
export const updateUserPassword = catchAsyncErrors(async (req, res, next) => {
  // Getting the user from the database
  const user = await User.findById(req.user.id).select("+password");

  // Check If User Input Password Match the User Password in the DB
  const isPasswordMatched = await user.comparePassword(req.body.oldPassword);
  if (!isPasswordMatched) {
    return next(
      new HandleAppErrors(
        "Your Old Password is Not Correct, If You want to ResetPassword use ForgotPassword Link",
        401
      )
    );
  }

  if (req.body.newPassword !== req.body.confirmPassword) {
    return next(
      new HandleAppErrors("The Password you Entered do not Match", 401)
    );
  }

  user.password = req.body.newPassword;

  await user.save();

  sendJwtAcessAndRefreshToken(user, 200, res);
});

/**************************************************
///  ALLOWING USER TO DELETE HIS/HER ACCOUNT
 **************************************************/
export const deleteMe = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(200).json({
    status: "success",
    message: `This ${user.name} User Has Been Successfully, Deactivated`,
  });
});

/****************************************************************
////*  IMPLEMENTING FORGOT AND RESET PASSWORD FUNCTIONALITIES
 ***************************************************************/
export const forgotPassword = catchAsyncErrors(async (req, res, next) => {
  const { email } = req.body;
  // Find the User
  const user = await User.findOne({ email });
  // Check if the User Exist
  if (!user) {
    return next(
      new HandleAppErrors(
        "There is no User with the Provided Email Address",
        400
      )
    );
  }

  // Generate ResetToken and Save the User with It Using the Instance Method in UserModel
  const resetToken = await user.generatePasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // sending email to the user
  const resetURL = `${req.protocol}://${req.get(
    "host"
  )}/api/v2/users/password/reset/${resetToken}`;

  const message = `Forgot your password! submit a patch request with your new password and passwordConfirm to: 
    ${resetURL}.\nIf you don't forget your password, please ignore this email`;

  try {
    sendMail(email, "adcomtechcomp@gmail.com", "Reset Password", message);

    res.json({
      msg: `A verification message is successfully sent to ${user?.email}. Reset now within 10 minutes, ${resetURL}`,
    });
  } catch (err) {
    user.passwordRestToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    // console.log(err);
    return next(
      new HandleAppErrors(
        "There was an error sending the email! please try again later",
        500
      )
    );
  }
});

///////////////////////////////
//// ACTUAL RESET PASSWORD FUNCTIONALITIES
export const resetPassword = catchAsyncErrors(async (req, res, next) => {
  const { password, confirmPassword } = req.body;
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  //find this user by token
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user)
    return next(new HandleAppErrors("Token Expired, try again later", 400));

  if (password !== confirmPassword) {
    return next(
      new HandleAppErrors("The Password you Entered do not Match", 400)
    );
  }

  //Update/change the password
  user.password = password;
  user.confirmPassword = confirmPassword;

  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  // save the user with the updated data
  const result = await user.save();

  if (!result) {
    return next(
      new HandleAppErrors(
        "There was an error sending the email! please try again later",
        500
      )
    );
  }

  // CREATE TOKEN AND LOG THE USER IN
  sendJwtAcessAndRefreshToken(user, 200, res);
});

/****************************************************************
////*  IMPLEMENTING ACCOUNT VERIFICATION FUNCTIONALITIES
 ***************************************************************/
// Account Verification Token Generation
export const getAccountVerifyToken = catchAsyncErrors(
  async (req, res, next) => {
    const { email } = req.body;
    const loginUserId = req.user.id;

    const user = await User.findById(loginUserId);
    if (!user) {
      return next(new HandleAppErrors("There is no user Id Found", 404));
    }

    // Getting the Random token using Instance method in the usermodal
    const verificationToken = await user.generateAccountVerificationToken();
    //save the user
    await user.save({ validateBeforeSave: false });

    // sending email to the user
    const accountVerificationURL = `${req.protocol}://${req.get(
      "host"
    )}/api/v1/users/account-verify/${verificationToken}`;

    //build your message
    const message = `If you were requested to verify your account, verify now within 10 minutes, otherwise ignore this message ${accountVerificationURL}>Click to verify your account</a>`;

    // Calling Send mail Function
    sendMail(email, "adcomtechcomp@gmail.com", "Account Verification", message);

    res.status(200).json({
      status: "Success",
      message: `Token: "${verificationToken}" is sent to your Email`,
    });
  }
);

//------------------------------
// Account Verification
////////////////////////////////

export const accountVerification = catchAsyncErrors(async (req, res, next) => {
  const { token } = req.params;
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  //find this user by token
  const user = await User.findOne({
    accountVerificationToken: hashedToken,
    accountVerificationTokenExpires: { $gt: new Date() },
  });

  if (!user)
    return next(new HandleAppErrors("Token expired, try again later", 401));

  //update the proprt to true
  user.isAccountVerified = true;
  user.accountVerificationToken = undefined;
  user.accountVerificationTokenExpires = undefined;

  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    status: "Success",
    user,
  });
});
