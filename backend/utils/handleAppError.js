class HandleAppErrors extends Error {
  constructor(message, statusCode) {
    super(message);

    this.statusCode = statusCode;

    // This Checks if the Error is Operational Error i.e the One we know or Not
    this.status = `${statusCode}`.startsWith(4) ? "fail" : "error";
    this.isOperational = true;

    // This Captures the Error and Displays it
    Error.captureStackTrace(this, this.constructor);
  }
}

export default HandleAppErrors;
