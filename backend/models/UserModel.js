import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const { ObjectId } = mongoose.Schema;

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "A User Must Have a Name"],
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Please Provide a Valid Email Address for Your Account"],
      unique: true,
      lowercase: true,
      validate: [
        validator.isEmail,
        "Email Provided is not a Valid Email Address",
      ],
    },

    password: {
      type: String,
      required: [
        true,
        "A User must have a Password of atleast Eight Characters",
      ],
      minlength: 8,
      select: false, // This hides the password from the outpout
    },

    confirmPassword: {
      type: String,
      required: [true, "Please Confirm Your Passowrd"],
      select: false,
      validate: {
        validator: function (checkPass) {
          return checkPass === this.password;
        },
        message: "The Password you Provided do not Match",
      },
    },

    active: {
      type: Boolean,
      default: true,
      select: false,
    },

    isAccountVerified: {
      type: Boolean,
      default: false,
    },

    isBlocked: {
      type: Boolean,
      default: false,
    },

    isFollowing: {
      type: Boolean,
      default: false,
    },

    isUnFollowing: {
      type: Boolean,
      default: false,
    },

    followers: {
      type: [
        {
          type: ObjectId,
          ref: "User",
        },
      ],
    },

    following: {
      type: [
        {
          type: ObjectId,
          ref: "User",
        },
      ],
    },

    avatar: {
      public_id: {
        type: String,
        default:
          "https://www.google.com/imgres?imgurl=https%3A%2F%2Fstatic-00.iconduck.com%2Fassets.00%2Favatar-default-symbolic-icon-256x256-q0fen40c.png&imgrefurl=https%3A%2F%2Ficonduck.com%2Ficons%2F111220%2Favatar-default-symbolic&tbnid=xR23ya_DH7XDoM&vet=12ahUKEwim0q-j4tP9AhWKpicCHTCuAMYQMyhZegUIARCyAQ..i&docid=l-pQXAp8kzJf-M&w=256&h=256&q=avatar%20icon%20svg&ved=2ahUKEwim0q-j4tP9AhWKpicCHTCuAMYQMyhZegUIARCyAQ",
      },
      url: {
        type: String,
        default:
          "https://www.google.com/imgres?imgurl=https%3A%2F%2Fstatic-00.iconduck.com%2Fassets.00%2Favatar-default-symbolic-icon-256x256-q0fen40c.png&imgrefurl=https%3A%2F%2Ficonduck.com%2Ficons%2F111220%2Favatar-default-symbolic&tbnid=xR23ya_DH7XDoM&vet=12ahUKEwim0q-j4tP9AhWKpicCHTCuAMYQMyhZegUIARCyAQ..i&docid=l-pQXAp8kzJf-M&w=256&h=256&q=avatar%20icon%20svg&ved=2ahUKEwim0q-j4tP9AhWKpicCHTCuAMYQMyhZegUIARCyAQ",
      },
    },

    role: {
      type: String,
      enum: ["User", "Seller", "Admin"],
      default: "User",
    },

    seller: {
      shopName: {
        type: String,
        // required: [true, "Please Provide a Name to Your Online Shop"],
        minlength: [3, "Please Enter a Name with atleast 3 Characters"],
        maxlength: [20, "Please Enter a Name Between 10 to 120 Characters"],
      },

      ownerName: {
        type: String,
        // required: [true, "Please Provide the Shop Owner's Name"],
      },

      phoneNumber: {
        type: Number,
        minlength: [11, "Phone Number must be up to 11 Digits"],
        // required: [true, "A Shop must Bear Owner's Phone Number"],
      },

      address: {
        type: String,
        // required: true,
      },

      city: String,

      state: String,

      description: String,

      logo: {
        public_id: String,
        url: String,
      },

      isSellerApproved: Boolean,
    },

    topicCount: {
      type: Number,
      // default: 0,
    },

    ratingsAvg: {
      type: Number,
      // default: 0,
      // required: true,
    },

    ratingsQty: {
      type: Number,
      // default: 0,
      // required: true,
    },

    accountVerificationToken: String,

    accountVerificationTokenExpires: Date,

    passwordChangedAt: Date,

    passwordResetToken: String,

    passwordResetExpires: Date,

    refreshToken: String,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

//virtual method to populate created post
userSchema.virtual("topics", {
  ref: "Topic",
  foreignField: "user",
  localField: "_id",
});

// Hidding deactivated users from postman output
userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });

  next();
});

// Hashing User Passage on Save
userSchema.pre("save", async function (next) {
  // Checks is Password is Modified
  if (!this.isModified("password")) return next();

  // Actual Hashing of Passowrd
  const salt = await bcrypt.genSalt(10);
  const hashPass = await bcrypt.hash(this.password, salt);

  // Assign the Password to the HashedPass
  this.password = hashPass;

  // Delete the Confirm Password Field
  this.confirmPassword = undefined;

  // Go to Next MiddleWawre
  next();
});

// Instance Methods to Get JsonWebToekn Access Token
userSchema.methods.getJWTAccessToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_ACCESS_TOKEN_SECRET, {
    expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRES_IN,
  });
};

// Instance Methods to Get JsonWebToekn Refresh Toke
userSchema.methods.getJWTRefreshToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.JWT_REFRESH_TOKEN_SECRET_EXPIRES_IN,
  });
};

// Method that Compares User Password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Methods That Checks Whether User Changed Password
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  // Checks if There is PasswordChangedAt Field in the Model
  if (this.passwordChangedAt) {
    // converting passwordChangedAt to timestamp
    const generateTime = this.passwordChangedAt.getTime() / 1000;

    const changedTimestamp = parseInt(generateTime, 10);

    return JWTTimestamp < changedTimestamp;
  }

  return false;
};

// INSTANCE METHOD TO GENERATE PASSWORD RESET TOKEN
userSchema.methods.generatePasswordResetToken = async function () {
  // Generate a Token Using Crypto
  const resetToken = crypto.randomBytes(32).toString("hex");

  // Hashing the Generated Token and Adding it to the PasswordResetToken Field
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Define the Time for the Generated Token to Expire
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; //10 minutes

  // Then Return the Generated ResetToken for easy Access
  return resetToken;
};

// User Account Verification Instance Method
userSchema.methods.generateAccountVerificationToken = async function () {
  //create a token
  const verificationToken = crypto.randomBytes(32).toString("hex");

  this.accountVerificationToken = crypto
    .createHash("sha256")
    .update(verificationToken)
    .digest("hex");

  this.accountVerificationTokenExpires = Date.now() + 10 * 60 * 1000; //10 minutes

  return verificationToken;
};

export const User = mongoose.model("User", userSchema);
