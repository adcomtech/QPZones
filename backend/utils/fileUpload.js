import multer from "multer";
import sharp from "sharp";
import path from "path";

import { catchAsyncErrors } from "./catchAsyncErrors.js";

const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    // console.log(file.mimetype);
    cb(null, "./files/uploads");
  },
  filename: (req, file, cb) => {
    const fileExt = file.mimetype.split("/")[1];
    console.log(fileExt);
    //check file type
    const docx = "vnd.openxmlformats-officedocument.wordprocessingml.document";
    const doc = "msword";
    const pdf = "pdf";
    if (fileExt !== doc && fileExt !== docx && fileExt !== pdf) {
      return cb(new Error("Please upload a Image"));
    } else {
      return cb(null, file.originalname);
    }
  },
});
// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "public/uploads");
//   },

//   filename: (req, file, cb) => {
//     const ext = file.mimetype.split("/")[1];

//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   },
// });
//will be using this for uplading
const diskUpload = multer({ storage: multerStorage });

export const uploadFileToDisk = diskUpload.single("file");

// Multer File Upload to Memory
const multerStorageMemory = multer.memoryStorage();
// creating multer filter
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new appError("Not an Image, please upload only image", 400), false);
  }
};

const upload = multer({
  storage: multerStorageMemory,
  fileFilter: multerFilter,
});

export const profileUpload = upload.single("avatar");

// //////////////////////////////////////////////////////////////////////
// //         MULTER FUNCTIONAITY FOR IMAGE RESIZING with sharp
// //////////////////////////////////////////////////////////////////////

export const resizeUserPhoto = catchAsyncErrors(async (req, res, next) => {
  if (!req.file) return next();
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile(`public/images/users/${req.file.filename}`);

  next();
});
