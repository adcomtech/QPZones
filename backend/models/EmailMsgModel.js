import mongoose from "mongoose";

const { ObjectId } = mongoose.Schema;

const emailMsgSchema = new mongoose.Schema(
  {
    from: {
      type: String,
      required: true,
    },

    to: {
      type: String,
      required: true,
    },

    message: {
      type: String,
      required: true,
    },

    subject: {
      type: String,
      required: true,
    },

    sentBy: {
      type: ObjectId,
      ref: "User",
      required: true,
    },

    isFlagged: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  }
);

emailMsgSchema.pre(/^find/, function (next) {
  this.populate({
    path: "sentBy",
    select: "name, email, avatar",
  });

  next();
});

export const EmailMsg = mongoose.model("EmailMsg", emailMsgSchema);
