import mongoose from "mongoose";

export async function connectToDatabase(uri: string) {
  mongoose.connection.on("connected", () => console.log("MongoDB connected"));
  mongoose.connection.on("error", (error) => console.error("MongoDB error:", error));

  await mongoose.connect(uri);
}
