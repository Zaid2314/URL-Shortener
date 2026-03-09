const express = require("express");
const path = require("path");
const { connectToMongoDB } = require("./connect");

const app = express();

const urlRoute = require("./routes/url");
const staticRoute = require("./routes/staticRouter");
const userRoute = require("./routes/user");

const rateLimit = require("express-rate-limit");

const PORT = 8001;

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: "Too many requests. Try again later."
});

connectToMongoDB("mongodb://localhost:27017/short-url")
  .then(() => console.log("MongoDb Connected"));

app.set("view engine", "ejs");
app.set("views", path.resolve("./views"));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// apply limiter only to url routes
app.use("/url", limiter);

app.use("/url", urlRoute);
app.use("/", staticRoute);
app.use("/user", userRoute);

app.listen(PORT, () => console.log(`Server Started at PORT : ${PORT}`));