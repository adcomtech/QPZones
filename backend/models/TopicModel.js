import mongoose from "mongoose";
import slugify from "slugify";

import { User } from "./UserModel.js";

const { ObjectId } = mongoose.Schema;

const topicSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "A Topic must have a Title"],
      unique: true,
    },

    slug: {
      type: String,
      unique: true,
      index: true,
    },

    summary: {
      type: String,
      required: [true, "Please Provide Summary to the Topic!"],
    },

    description: {
      type: String,
      required: [true, "Please, Provide Chapter One of the Topic!"],
    },

    price: {
      type: Number,
      default: 3000,
      required: true,
    },

    // Parent Referencing
    department: {
      type: ObjectId,
      ref: "Department",
      // required: [true, 'Provide the Department for the Topic'],
    },

    category: {
      type: String,
      required: [true, "A Topic must Belong to a Category!"],
    },

    level: {
      type: String,
      enum: ["Postgraduate", "Undergraduate"],
      default: "Undergraduate",
    },

    degree: {
      type: String,
      enum: ["M.SC", "MBA/PGD", "B.SC", "HND", "ND", "NCE"],
      required: [true, "A Topic must have a Degree Level"],
    },

    file: {
      public_id: {
        type: String,
        // default: "avatar-url",
        // required: [true, "Make sure to Include the File for the Topic"],
      },

      url: {
        type: String,
        // default: "avatar-url",
        // required: [true, "Make sure to Include the File for the Topic"],
      },
    },

    fileExt: {
      type: String,
      enum: ["Pdf", "Doc", "Docx"],
      default: "Docx",
    },

    seller: {
      type: ObjectId,
      ref: "User",
      required: true,
    },

    ratingsQty: {
      type: Number,
      default: 0,
    },

    ratingsAvg: {
      type: Number,
      default: 4.7,
      min: [1, "A Topic rating must be above 1.0"],
      max: [5, "A Topic rating must be below 5.0"],
      set: (val) => Math.round(val * 10) / 10,
    },

    isLiked: {
      type: Boolean,
      default: false,
    },
    isDisLiked: {
      type: Boolean,
      default: false,
    },
    numViews: {
      type: Number,
      default: 0,
    },
    likes: [
      {
        type: ObjectId,
        ref: "User",
      },
    ],
    disLikes: [
      {
        type: ObjectId,
        ref: "User",
      },
    ],
  },
  {
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
    timestamps: true,
  }
);

// This Adds Reviews to the Topic it belongs to
topicSchema.virtual("reviews", {
  ref: "Review",
  foreignField: "topic",
  localField: "_id",
});

// POPULATING A USERS WHO ARE SELLERS IN A TOPIC Queries that starts with Find
topicSchema.pre(/^find/, function (next) {
  this.populate({
    path: "seller",
    select: "name email avatar role",
  });

  next();
});

// This Creates Slugs for the Topics
topicSchema.pre("save", function (next) {
  this.slug = slugify(this.title, { lower: true });
  next();
});

// Tracking Number of Topics Created by a Seller
topicSchema.statics.getSellerTopicsCount = async function (sellerId) {
  const stats = await this.aggregate([
    {
      $match: { seller: sellerId },
    },
    {
      $group: {
        _id: "$seller",
        tCount: { $sum: 1 },
        // avgRating: { $avg: "$rating" },
      },
    },
  ]);

  // Updating the calculated fields
  if (stats.length > 0) {
    await User.findByIdAndUpdate(sellerId, {
      topicCount: stats[0].tCount,
      // ratingsAvg: stats[0].avgRating,
    });
  } else {
    await Topic.findByIdAndUpdate(sellerId, {
      topicCount: 0,
      // ratingsAverage: 4.7,
    });
  }
};

//  Calling the Method when the document saves using Consructor which is current model
topicSchema.post("save", function () {
  this.constructor.getSellerTopicsCount(this.seller);
});

export const Topic = mongoose.model("Topic", topicSchema);
