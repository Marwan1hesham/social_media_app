import mongoose from "mongoose";
import { MONGO_URI } from "../config/config.service";

export const checkConnectionDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log(`DB connected successfully ${MONGO_URI}`);
  } catch (error) {
    console.log("Failed to connect to the databse", error);
  }
};
