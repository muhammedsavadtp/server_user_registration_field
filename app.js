require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const connectDB = require("./db/dbConfig");
const { errorHandler, errorGenerator } = require("./error/errorHandler");
const validateToken = require("./middleware/verifyToken");


//routes
const userAuth = require('./controller/userController')


//connect to database
connectDB();
//app level middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logic goes here
app.get("/",validateToken,(req, res)=>{
    res.send('hello ')
})
app.use("/user", userAuth);


//error handling
app.use(errorGenerator);
app.use(errorHandler);

module.exports = app;
