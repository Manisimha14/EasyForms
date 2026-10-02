import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import "dotenv/config";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
const app = express();
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`server is running on the port ${port}`);
});
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(helmet())
app.use(morgan("dev"))
app.get("/", (req, res) => {
  res.send("Server is Ready");
});
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("DB Connection Successful");
  })
  .catch((err) => {
    console.log(err);
  });