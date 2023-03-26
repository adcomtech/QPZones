import HandleAppErrors from "../utils/handleAppError.js";

const globalAppErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";
  err.message = err.message || "Internal Server Error";

  // Handle CastError
  if (err.name === "CastError") {
    const message = `Resources not Found ${err.path}: ${err.value}`;
    // return new AppErrorHandler(message, 400);
    err = new HandleAppErrors(message, 400);
  }

  // Handle Duplicate Field Errors
  if (err.code === 11000) {
    // const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
    const objValue = Object.keys(err.keyValue);
    const message = `Duplicate fields: ${objValue}, Please use another value`;
    // return new createAppError(message, 400);
    err = new HandleAppErrors(message, 400);
  }

  // if (err.name === "ObjectParameterError") {
  //   // const objValue = Object.keys(err.keyValue);
  //   const message = `The Parameter Provided, value: ${value}, Please use another value`;
  //   // return new createAppError(message, 400);
  //   err = new HandleAppErrors(message, 400);
  // }

  // if (err.name === "ValidationError") {
  //   // Handle Validatiion Error
  //   // looping over the fileds that are duplicated
  //   const errors = Object.values(err.errors).map((el) => el.message);
  //   const message = `Invalid input data: "${errors.join(". ")}"`;
  //   // return new createAppError(message, 400);
  //   err = new HandleAppErrors(message, 400);
  // }

  if (err.name === "JsonWebTokenError") {
    return new HandleAppErrors(
      "Invalid Token Detected, Please Login Again",
      401
    );
  }

  if (err.name === "TokenExpiredError") {
    return new HandleAppErrors(
      "Expired Token Detected, Please Login Again!",
      401
    );
  }

  if (process.env.NODE_ENV === "development") {
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  } else if (process.env.NODE_ENV === "production") {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }

  // res.status(err.statusCode).json({
  //   status: err.status,
  //   // message: err.message,
  //   message: err.stack,
  // });
};

export default globalAppErrorHandler;
