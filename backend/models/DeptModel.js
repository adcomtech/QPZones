import mongoose from "mongoose";
import slugify from "slugify";

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: [true, "Please provide a name for the Deprtment"],
      minlength: [2, "Too short, the Field does not support Abbreviation"],
    },

    slug: {
      type: String,
      unique: true,
      index: true,
    },

    topicCount: {
      type: Number,
      default: 0,
    },
  },
  {
    toJSON: { virtuals: true },

    toObject: { virtuals: true },

    timestamps: true,
  }
);

// Slugifying the The Slug
departmentSchema.pre("save", function (next) {
  this.slug = slugify(this.name, { lower: true });

  next();
});

// VIRTUAL POPULATION BASICALLY IS THE WAY OF CONNECTING PARENT MODALS TO CHILD

// This Adds Departments to the Topic it belongs to
departmentSchema.virtual("topics", {
  ref: "Topic",
  foreignField: "department",
  localField: "_id",
});

// Creating Model Out of the Schema (Which means Departments Collection in DB)
export const Department = mongoose.model("Department", departmentSchema);
