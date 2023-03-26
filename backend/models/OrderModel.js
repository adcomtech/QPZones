import mongoose from "mongoose";
const { ObjectId } = mongoose.Schema;

const orderSchema = new mongoose.Schema(
  {
    orderedItems: [
      {
        topic: {
          type: ObjectId,
          ref: "Topic",
        },

        quantity: {
          type: Number,
          required: true,
        },
      },
    ],

    orderedBy: {
      type: ObjectId,
      ref: "User",
      // required: true,
    },

    offlineUserInfo: {
      Name: {
        type: String,
        // required: true,
      },

      email: {
        type: String,
        // required: true,
      },

      phoneNo: {
        type: Number,
        // required: true,
      },

      address: String,
    },

    paymentInfo: {
      id: {
        type: String,
        // required: true,
      },

      status: {
        type: String,
        // required: true,
      },
    },

    itemsPrice: {
      type: Number,
      required: true,
      default: 0,
    },

    totalPrice: {
      type: Number,
      required: true,
    },

    paidAt: {
      type: Date,
      required: true,
    },

    orderDelivered: Date,

    orderStatus: {
      type: String,
      default: "Not Processed",
      enum: [
        "Not Processed",
        "processing",
        "Dispatched",
        "Cancelled",
        "Completed",
      ],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// POPULATING USER AND TOPIC DATA ON THE ORDER
orderSchema.pre(/^find/, function (next) {
  this.populate({
    path: "oderedBy",
    select: "name, email, phoneNumber avatar",
  }).populate({
    path: "orderedItems.topic",
  });

  next();
});

export const Order = mongoose.model("Order", orderSchema);
