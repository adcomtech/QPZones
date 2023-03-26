import mongoose from "mongoose";

export const validateMongodbId = (id) => {
  const isValid = mongoose.Types.ObjectId.isValid(id);
  if (!isValid) throw new Error("The ID Provided is Not a Valid MongoDB ID");
};
