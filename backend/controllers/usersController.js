import { User } from "../models/UserModel.js";
import { catchAsyncErrors } from "../utils/catchAsyncErrors.js";
import cloudinary from "cloudinary";
import HandleAppErrors from "../utils/handleAppError.js";
import { validateMongodbId } from "../utils/validateID.js";
import ApiFeatures from "../utils/ApiFeatures.js";
import { sendMail } from "../utils/eMail.js";
import {
  createActivationToken,
  verifyActivationToken,
} from "../utils/activationToken.js";
import { uploadFileToCloud } from "../utils/cloudinary.js";

/******************************************
///* CREATE NEW USER AS A SELLER
 *****************************************/
export const createNewSeller = catchAsyncErrors(async (req, res) => {
  const { name, email, password, confirmPassword } = req.body;

  // Implement Cloudinary for Image Upload
  const { logo } = req.files;
  const uploadShopLogo = await uploadFileToCloud(logo, {
    upload_preset: "QPzone_Users",
    public_id: `${logo.name}`,
    resource_type: "image",
    width: 150,
    crop: "scale",
  });
  const seller = {
    name,
    email,
    password,
    confirmPassword,
    role: "Seller",
    seller: {
      shopName: req.body.seller.shopName,
      ownerName: req.body.seller.ownerName,
      address: req.body.seller.address,
      state: req.body.seller.state,
      city: req.body.seller.city,
      description: req.body.seller.description,
      phoneNumber: req.body.seller.phoneNumber,
      logo: uploadShopLogo,
    },
  };

  // Implementing Accounting Acctivation on Registration
  const activationToken = createActivationToken({ ...seller });

  const activationUrl = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/users/seller/activation/${activationToken}`;

  const userEmail = seller.email;
  const subject = "Activate your Account to Get Full Access to the Shop";
  const message = `Hello ${seller.name}, Please Click on the Link Below to Activate your Shop \n${activationUrl}`;

  try {
    await sendMail(userEmail, "adcomtechcomp@gmail.com", subject, message);

    res.status(201).json({
      success: true,
      activationToken,
      message: `Please Check your Email:- ${userEmail} to Activate your Shop!`,
    });
  } catch (error) {
    return next(new HandleAppErrors(error.message, 500));
  }
});

/******************************************
///* ACTIVATE SELLER SHOP ACCOUNT
 *****************************************/
export const activateSeller = catchAsyncErrors(async (req, res, next) => {
  try {
    const { activation_token } = req.body;

    const newSeller = verifyActivationToken(activation_token);

    // console.log(newSeller);

    if (!newSeller) {
      return next(new HandleAppErrors("Invalid token", 403));
    }

    const { name, email, password, confirmPassword } = newSeller;
    const {
      ownerName,
      shopName,
      address,
      city,
      state,
      phoneNumber,
      description,
    } = newSeller.seller;

    let seller = await User.findOne({ email }).select("+password");

    if (seller) {
      return next(new HandleAppErrors("User already exists", 400));
    }

    seller = await User.create({
      role: "Seller",
      name,
      email,
      password,
      confirmPassword,
      ownerName,
      shopName,
      address,
      city,
      state,
      phoneNumber,
      description,
    });

    res.status(201).json({
      status: "success",
      seller,
      message:
        "Congratulations! You have Successfully Joined our Great Sellers Team Kindly Login to Explore. ",
    });
  } catch (error) {
    return next(new HandleAppErrors(error.message, 500));
  }
});

/******************************************
///* UPDATE A LOGGED IN USER TO SELLER
 *****************************************/
export const updateUserToSeller = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.user;
  const { logo } = req.files;

  const sellerData = {
    role: "Seller",
    seller: {
      shopName: req.body.seller.shopName,
      ownerName: req.body.seller.ownerName,
      phoneNumber: req.body.seller.phoneNumber,
      address: req.body.seller.address,
      state: req.body.seller.state,
      city: req.body.seller.city,
      description: req.body.seller.description,
    },
  };

  if (logo !== "") {
    const user = await User.findById(id);

    // Delete Image From Cloudinary
    const imageId = user.seller.logo.public_id;
    await cloudinary.uploader.destroy(imageId);

    // Implement Cloudinary for Image Upload
    const uploadShopLogo = await uploadFileToCloud(logo, {
      upload_preset: "QPzone_Users",
      public_id: `${logo.name}`,
      resource_type: "image",
      width: 150,
      crop: "scale",
    });

    newUserData.seller.logo = {
      uploadShopLogo,
    };
  }

  const sellerUpdateData = await User.findByIdAndUpdate(id, sellerData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({
    status: "success",
    sellerUpdateData,
    message:
      "You have Successfully Joined our Great Sellers Team Kindly Wait for Approval Notification through your Registered Email in Not Less Than an Hour ",
  });
});

/******************************************
///* UPDATE SHOP LOGO FUNCTIONALITY
 *****************************************/
export const updateShopLogo = catchAsyncErrors(async (req, res, next) => {});

/******************************************
///* GET TOP SELLERS FUNCTIONALITY
 *****************************************/
export const getTopSellers = catchAsyncErrors(async (req, res, next) => {
  const topSellers = await User.find({ role: "Seller" })
    .sort({ "user.ratingsQty": -1 })
    .limit(3);

  if (!topSellers) return next(new HandleAppErrors("No Seller Found", 404));

  res.status(200).json({
    status: "success",
    result: topSellers.length,
    topSellers,
  });
});

/******************************************
///* GET ALL USERS FUNCTIONALITY
 *****************************************/
export const getAllUsers = catchAsyncErrors(async (req, res, next) => {
  // Set of Users to Display Per Page
  const resultPerPage = 10;

  // Count Total Number of Users in the Document
  const totalNumOfUsers = await User.countDocuments();

  // Querying User Collection Based on the API Feaures
  const feature = new ApiFeatures(User.find(), req.query)
    .filter()
    .searchUser()
    .sort()
    .limitFields()
    .pagination(resultPerPage);

  // const users = await User.find().select("-seller");

  const users = await feature.query.select("-seller");

  if (!users?.length) return next(new HandleAppErrors("No Users Found", 204));

  res.status(200).json({
    status: "success",
    numUsersInDoc: totalNumOfUsers,
    results: users.length,
    users,
  });
});

/****************************
 * GET SELLERS FUNCTIONALITY
 ***************************/
export const getSellers = catchAsyncErrors(async (req, res, next) => {
  // Set of Users to Display Per Page
  const resultPerPage = 10;

  // Count Total Number of Users in the Document
  const totalNumOfUsers = await User.countDocuments();

  // Querying User Collection Based on the API Feaures
  const feature = new ApiFeatures(User.find({ role: "Seller" }), req.query)
    .filter()
    .searchUser()
    .sort()
    .limitFields()
    .pagination(resultPerPage);

  // const sellers = await User.find({ role: "Seller" });
  const sellers = await feature.query;

  if (!sellers.length)
    return next(new HandleAppErrors("No Sellers Found", 404));

  res.status(200).json({
    status: "success",
    numOfUsersDoc: totalNumOfUsers,
    numOfSellers: sellers.length,
    sellers,
  });
});

/****************************
 * GET USER FUNCTIONALITY
 ***************************/
export const getUserDetails = catchAsyncErrors(async (req, res, next) => {
  // Get the User by ID
  let user;
  user = await User.findById(req.params.id).select("-seller");

  if (!user) {
    return next(new HandleAppErrors("No user with that ID", 404));
  }

  if (user.role === "Seller") {
    user = await User.findById(req.params.id).select("+seller");
  }

  res.status(200).json({
    status: "success",
    user,
  });
});

/****************************
 * GET USER FUNCTIONALITY
 ***************************/
export const updateUserRole = catchAsyncErrors(async (req, res, next) => {
  const newUserData = {
    name: req.body.name,
    email: req.body.email,
    role: req.body.role,
  };

  const user = await User.findByIdAndUpdate(req.params.id, newUserData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({
    status: "success",
    user,
  });
});

/****************************
//* DELETE USER FUNCTIONALITY
 ***************************/
export const deleteUser = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findByIdAndDelete(req.params.id);

  const imageId = user.avatar.public_id;

  await cloudinary.v2.uploader.destroy(imageId);

  if (!user) {
    return next(new HandleAppErrors(`User ID ${req.params.id} not found`, 404));
  }

  res.status(204).json({
    status: "success",
    message: "You have Successfully Deleted the User",
  });
});

/************************************************************
// IMPLEMENTING FOLLOWING USER FUNCTIONALITY
*************************************************************/
export const userFollowing = catchAsyncErrors(async (req, res, next) => {
  // Find a User to Follwoing and Update the Following Field
  const { followId } = req.body;
  const userId = req.user.id;
  const userToFollow = await User.findById(followId);

  // Find if the User is Alreadying following
  const alreadyFollowingUser = userToFollow?.followers?.find(
    (user) => user.toString() === userId.toString()
  );

  // Check if it is already following
  if (alreadyFollowingUser)
    return next(new HandleAppErrors("You Already Followed this User", 400));

  //1. Now Update the User Follower Field If not yet Following
  await User.findByIdAndUpdate(
    followId,
    {
      $push: { followers: userId },
      isFollowing: true,
    },
    { new: true, runValidators: true }
  );

  //2. Update the login user following field
  await User.findByIdAndUpdate(
    userId,
    {
      $push: { following: followId },
    },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    status: "success",
    message: "You have successfully followed this user",
  });
});

/************************************************************
// IMPLEMENTING UNFOLLOWING USER FUNCTIONALITY
*************************************************************/
export const unFollowUser = catchAsyncErrors(async (req, res, next) => {
  // Find the User you want unfollow and update its unfollowers Field
  const { unFollowId } = req.body;
  const loginUserId = req.user.id;

  await User.findByIdAndUpdate(
    unFollowId,
    {
      $pull: { followers: loginUserId },
      isFollowing: false,
    },
    { new: true }
  );

  await User.findByIdAndUpdate(
    loginUserId,
    {
      $pull: { following: unFollowId },
    },
    { new: true }
  );

  res.status(200).json({
    status: "success",
    message: "You have Successfully Unfollowed this User",
  });
});

/***********************************************
// IMPLEMENTING USER BLOCKAGE FUNCTIONLITY
****************************/
export const blockUser = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  validateMongodbId(id);

  const user = await User.findByIdAndUpdate(
    id,
    {
      isBlocked: true,
    },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    status: "success",
    user,
  });
});

/***********************************************
// IMPLEMENTING USER UNBLOCKING FUNCTIONLITY
****************************/
export const unBlockUser = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  validateMongodbId(id);

  const user = await User.findByIdAndUpdate(
    id,
    {
      isBlocked: false,
    },
    { new: true }
  );

  res.status(200).json({
    status: "success",
    user,
  });
});
/****************************
// GET USER STATISTICS
****************************/
export const getUsersStats = catchAsyncErrors(async (req, res, next) => {
  // Calculating the Previous Month
  const previousMonth = moment()
    .month(moment().month() - 1)
    .set("date", 1)
    .format("DD-MM-YYYY HH:mm:ss");

  const users = await User.aggregate([
    {
      $match: {
        createdAt: { $gte: new Date(previousMonth) },
      },
    },

    // Seting a field in our collection in this case user colleciton
    {
      $project: {
        month: { $month: "$createdAt" },
      },
    },

    // grouping our user data based on a particular month got from the project up above
    {
      $group: {
        _id: "$month",
        total: { $sum: 1 }, // this adds up the found group of data
      },
    },
  ]);

  res.status(200).json({
    status: "success",
    users,
  });
});
