import mongoose from "mongoose";
import { Topic } from "./TopicModel.js";
import { User } from "./UserModel.js";

const { ObjectId } = mongoose.Schema;

const reviewSchema = new mongoose.Schema({
  review: {
    type: String,
    required: [true, "Review can not be empty"],
  },

  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: true,
  },

  user: {
    type: ObjectId,
    ref: "User",
    required: [true, "Review must Belong a User"],
  },

  topic: {
    type: ObjectId,
    ref: "Topic",
    required: [true, "Review must Belong to a Topic "],
  },

  createdAt: {
    type: Date,
    default: Date.now(),
  },
});

// Preventing Duplicate Review from a User in ONe Topic
reviewSchema.index({ topic: 1, user: 1 }, { unique: true });

// Populating User Info on the
reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: "user",
    select: "name, avatar",
  });

  next();
});
///////////////////////////////////////////////////////////////////////////////
//           CALCULATING AVERAGE RATING AND RATING QUANTITY
///////////////////////////////////////////////////////////////////////////////

reviewSchema.statics.calcAverageRating = async function (topicId) {
  const stats = await this.aggregate([
    {
      $match: { topic: topicId },
    },
    {
      $group: {
        _id: "$topic",
        nRating: { $sum: 1 },
        avgRating: { $avg: "$rating" },
      },
    },
  ]);

  // Updating the calculated fields
  if (stats.length > 0) {
    await Topic.findByIdAndUpdate(topicId, {
      ratingsQty: stats[0].nRating,
      ratingsAvg: stats[0].avgRating,
    });
  } else {
    await Topic.findByIdAndUpdate(topicId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.7,
    });
  }
};

//  Calling the Method when the document saves using Consructor which is current model
reviewSchema.post("save", function () {
  this.constructor.calcAverageRating(this.topic);
});

// Pass the Data to the Pre Middleware which Works for for Query
reviewSchema.pre(/^findOneAnd/, async function (next) {
  this.rev = await this.findOne().clone().exec();
  // console.log(this.rev);

  next();
});

// Retrieve the Data which was passed from Pre Middleware and perform the task on query
reviewSchema.post(/^findOneAnd/, async function () {
  await this.rev.constructor.calcAverageRating(this.rev.topic);
});

// Calcualting Rating Average on the User
reviewSchema.statics.calcAverageRatingForSellers = async function (userId) {
  const userStats = await this.aggregate([
    {
      $match: { user: userId },
    },
    {
      $group: {
        _id: "$user",
        nRating: { $sum: 1 },
        avgRating: { $avg: "$rating" },
      },
    },
  ]);

  // Updating the calculated fields
  if (userStats.length > 0) {
    await User.findByIdAndUpdate(userId, {
      ratingsQty: userStats[0].nRating,
      ratingsAvg: userStats[0].avgRating,
    });
  } else {
    await User.findByIdAndUpdate(userId, {
      ratingsQuantity: 0,
      ratingsAverage: 0,
    });
  }
};

// Calling the Method when the document saves using Consructor which is current model
reviewSchema.post("save", function () {
  this.constructor.calcAverageRatingForSellers(this.user);
});

// Pass the Data to the Pre Middleware which Works for for Query
reviewSchema.pre(/^findOneAnd/, async function (next) {
  this.rev = await this.findOne().clone().exec();
  // console.log(this.rev);

  next();
});

// Retrieve the Data which was passed from Pre Middleware and perform the task on query
reviewSchema.post(/^findOneAnd/, async function () {
  await this.rev.constructor.calcAverageRatingForSellers(this.rev.user);
});

export const Review = mongoose.model("Review", reviewSchema);
