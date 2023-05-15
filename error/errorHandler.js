// throwing error
const errorGenerator = (req, res, next) => {
  const error = new Error("404 resource not found");
  error.status = 404;
  next(error);
};

// error handler
const errorHandler = (error, req, res, next) => {
  if (error.status) {
    return res.status(error.status).json({ message: error.message });
  }
  res.status(500).json({ message: "something went wrong" });
};

module.exports = { errorGenerator, errorHandler };
