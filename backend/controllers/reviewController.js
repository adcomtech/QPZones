import { Review } from "../models/ReviewModel.js";
import { Topic } from "../models/TopicModel.js";
import ApiFeatures from "../utils/ApiFeatures.js";
import { catchAsyncErrors } from "../utils/catchAsyncErrors.js";
import HandleAppErrors from "../utils/handleAppError.js";

/******************************************
///* CREATE A NEW REVIEW FUNCTIONALITY
 *****************************************/
export const createNewReview = catchAsyncErrors(async (req, res, next) => {
  //      // allow nested route
  if (!req.body.topic) req.body.topic = req.params.topicId;
  if (!req.body.user) req.body.user = req.user.id;

  const topic = await Topic.findById(req.params.topicId);
  console.log(topic);

  const newReview = await Review.create(req.body);

  res.status(200).json({
    status: "success",
    review: newReview,
  });
});

export const getAllReviews = catchAsyncErrors(async (req, res, next) => {
  // Allowing Nested Route
  let filterReview = {};
  if (req.params.topicId) filterReview = { topic: req.params.topicId };

  // Set of Users to Display Per Page
  const resultPerPage = 10;

  // Count Total Number of Users in the Document
  const totalNumOfReview = await Review.countDocuments();

  // Querying User Collection Based on the API Feaures
  const feature = new ApiFeatures(Review.find(filterReview), req.query)
    .filter()
    .searchUser()
    .sort()
    .limitFields()
    .pagination(resultPerPage);

  // Get All Reviews by Filter
  // const reviews = await Review.find(filterReview);
  const reviews = await feature.query;

  res.status(200).json({
    status: "success",
    numReviewInDoc: totalNumOfReview,
    length: reviews.length,
    reviews,
  });
});

/******************************************
///* DELETE TOPIC REVIEW FUNCTIONALITY
 *****************************************/
export const deleteReview = catchAsyncErrors(async (req, res, next) => {
  const review = await Review.findByIdAndDelete(req.params.id);

  if (!review) {
    return next(new AppError("No Review found with that ID", 404));
  }

  res.status(204).json({
    status: "success",
    review: null,
    message: `You have Successfully Deleted a Reveiw`,
  });
});

/******************************************
///* UPDATe TOPIC REVIEW FUNCTIONALITY
 *****************************************/
export const updateReview = catchAsyncErrors(async (req, res, next) => {
  const review = await Review.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!review) {
    return next(new HandleAppErrors("No Review found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    review,
    message: `You have Successfully Updated a Reveiw`,
  });
});
