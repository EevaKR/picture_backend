import mongoose from "mongoose";
import { localDB } from "./localDB";

let useLocalDB = false;

const connectUserDB = async () => {
  try {
    // Use local MongoDB if MONGODB_URI is not set or connection fails
    const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/picturestore";
    console.log(`Connecting to MongoDB with URI: ${mongoUri}`);
    const conn = await mongoose.connect(mongoUri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    useLocalDB = false;
  } catch (error: any) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    console.log("Trying to connect to local MongoDB...");
    try {
      const conn = await mongoose.connect("mongodb://localhost:27017/picturestore");
      console.log(`Local MongoDB Connected: ${conn.connection.host}`);
      useLocalDB = false;
    } catch (localError: any) {
      console.error(`Local MongoDB connection failed: ${localError.message}`);
      console.log("🔄 Falling back to local file-based database for development");
      useLocalDB = true;
      // Initialize local database
      localDB;
    }
  }
};

mongoose.connection.on('error', err => {
  console.error(`MongoDB connection error: ${err}`);
  console.log("🔄 Switching to local file-based database");
  useLocalDB = true;
});

export default connectUserDB;
export { useLocalDB, localDB };
