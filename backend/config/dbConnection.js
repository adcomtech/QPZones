import mongoose from "mongoose";

export const dbConnectLocal = async () => {
  const URL = process.env.LOCAL_DB_URL;
  try {
    await mongoose.connect(URL);
    console.log(`mongoDB Connected Successfully on Local Server`);
  } catch (error) {
    console.log(`DB ERROR: ${error.message}`);
  }
};
