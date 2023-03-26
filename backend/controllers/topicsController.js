import { Topic } from "../models/TopicModel.js";
import { catchAsyncErrors } from "../utils/catchAsyncErrors.js";
import { uploadFileToCloud } from "../utils/cloudinary.js";
import HandleAppErrors from "../utils/handleAppError.js";
import ApiFeatures from "../utils/ApiFeatures.js";

/******************************************
///* CREATING A NEW TOPIC FUNCTIONALITY
 *****************************************/
export const createNewTopic = catchAsyncErrors(async (req, res, next) => {
  // const { file } = req.files;

  // const uploadTopics = await uploadFileToCloud(file, {
  //   upload_preset: "QPzone_Topics",
  //   public_id: `${file.name}`,
  //   resource_type: "raw",
  // });

  const topic = new Topic({
    ...req.body,
    seller: req.user.id,
    // file: uploadTopics,
  });

  const newTopic = await topic.save();

  res.status(201).json({
    status: "success",
    topic: newTopic,
  });
});

/******************************************
///* GET A SINGLE TOPICS FUNCTIONALITY
 *****************************************/
export const getTopicDetails = catchAsyncErrors(async (req, res, next) => {
  const topic = await Topic.findById(req.params.id)
    .populate("department")
    .populate("reviews");

  if (!topic)
    return next(
      new HandleAppErrors("No Topic Found with the ID you Provide!", 404)
    );

  res.status(200).json({
    success: true,
    topic,
  });
});

/******************************************
///* GET ALL TOPICS FUNCTIONALITY
 *****************************************/
export const getAllTopics = catchAsyncErrors(async (req, res, next) => {
  const resultPerPage = 10;

  // Counting Number of Topics in the Database
  const totalNumOfTopics = await Topic.countDocuments();

  // Query Topics Based on the API Feature
  const feature = new ApiFeatures(Topic.find(), req.query)
    .filter()
    .search()
    .sort()
    .limitFields()
    .pagination(resultPerPage);

  const topics = await feature.query;

  res.status(200).json({
    success: true,
    numOfDoc: totalNumOfTopics,
    length: topics.length,
    topics,
  });
});

/******************************************
///* UPDATE A TOPIC FUNCTIONALITY
 *****************************************/
export const updateTopic = catchAsyncErrors(async (req, res, next) => {
  // Find the Topic to be Updated
  let topic = await Topic.findById(req.params.id);
  // Check If it Exists
  if (!topic)
    return next(
      new HandleAppError("No Topic Found with the ID you Provide!", 404)
    );
  //  Cloadinary Image Update
  /****************************** */

  // Allowing An Admin to Update All Topic Created in the System
  const seller = topic.seller;
  const loginUser = req.user;

  if (loginUser.role === "Admin" && seller.role !== "Admin") {
    // Update If it Exist
    topic = await Topic.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
      useUnified: false,
    });

    // Send Response
    res.status(200).json({
      success: true,
      topic,
    });

    // Allowing A Seller to Update Topic Created by Him
  } else if (seller.id !== loginUser.id) {
    return next(
      new HandleAppErrors(
        "You do not Have the Permission to Update a Topic Created by Another Seller",
        403
      )
    );
  } else {
    // Update If it Exist
    topic = await Topic.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
      useUnified: false,
    });

    // Send Response
    res.status(200).json({
      success: true,
      topic,
    });
  }
});

/******************************************
///* DELETE A TOPIC FUNCTIONALITY
 *****************************************/
export const deleteTopic = catchAsyncErrors(async (req, res, next) => {
  const topic = await Topic.findByIdAndDelete(req.params.id);
  // Check If it Exists
  if (!topic)
    return next(
      new HandleAppError("No Topic Found with the ID you Provide!", 404)
    );

  res.status(200).json({
    success: true,
    message: `Topic with the ID: ${topic.title} is successfully deleted`,
  });
});

/******************************************
///* LIKING A TOPIC FUNCTIONALITY
 *****************************************/
export const likeTopic = catchAsyncErrors(async (req, res, next) => {
  //1.Find the topic to be liked
  const { topicId } = req.body;
  const topic = await Topic.findById(topicId);
  //2. Find the login user
  const loginUserId = req?.user?._id;
  //3. Find if this user has liked this topic?
  const isLiked = topic?.isLiked;
  //4.Chech if this user has dislikes this topic
  const alreadyDisliked = topic?.disLikes?.find(
    (userId) => userId?.toString() === loginUserId?.toString()
  );
  //5.remove the user from dislikes array if exists
  if (alreadyDisliked) {
    const topic = await Topic.findByIdAndUpdate(
      topicId,
      {
        $pull: { disLikes: loginUserId },
        isDisLiked: false,
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      status: "success",
      topic,
    });
    //Toggle
    //Remove the user if he has liked the topic
  } else if (isLiked) {
    const topic = await Topic.findByIdAndUpdate(
      topicId,
      {
        $pull: { likes: loginUserId },
        isLiked: false,
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      status: "success",
      topic,
    });
  } else {
    //add to likes
    const topic = await Topic.findByIdAndUpdate(
      topicId,
      {
        $push: { likes: loginUserId },
        isLiked: true,
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      status: "success",
      topic,
    });
  }
});

/******************************************
///* DISLIKING A TOPIC FUNCTIONALITY
 *****************************************/
export const disLikeTopic = catchAsyncErrors(async (req, res, next) => {
  //1.Find the topic to be disLiked
  const { topicId } = req.body;
  const topic = await Topic.findById(topicId);
  //2.Find the login user
  const loginUserId = req?.user?._id;
  //3.Check if this user has already disLikes
  const isDisLiked = topic?.isDisLiked;
  //4. Check if already like this topic
  const alreadyLiked = topic?.likes?.find(
    (userId) => userId.toString() === loginUserId?.toString()
  );

  //Remove this user from likes array if it exists
  if (alreadyLiked) {
    const topic = await Topic.findOneAndUpdate(
      topicId,
      {
        $pull: { likes: loginUserId },
        isLiked: false,
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      status: "success",
      topic,
    });
  } else if (isDisLiked) {
    const topic = await Topic.findByIdAndUpdate(
      topicId,
      {
        $pull: { disLikes: loginUserId },
        isDisLiked: false,
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      status: "success",
      topic,
    });
  } else {
    const topic = await Topic.findByIdAndUpdate(
      topicId,
      {
        $push: { disLikes: loginUserId },
        isDisLiked: true,
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      status: "success",
      topic,
    });
  }
});
