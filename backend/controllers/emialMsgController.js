import Filter from "bad-words";
import { EmailMsg } from "../models/EmailMsgModel.js";
import { catchAsyncErrors } from "../utils/catchAsyncErrors.js";
import { sendMail } from "../utils/eMail.js";
import HandleAppErrors from "../utils/handleAppError.js";

export const createEmailMsg = catchAsyncErrors(async (req, res, next) => {
  const { to, subject, message } = req.body;

  // get the Message
  const checkEmailMsg = `${subject} ${message}`;

  // Prevent Abusive Words
  const filter = new Filter();
  const abusiveWords = filter.isProfane(checkEmailMsg);

  if (abusiveWords)
    return next(
      new HandleAppErrors(
        "Email Message Sent Failed, Because it Contains some Profane or Abusive Words",
        403
      )
    );

  try {
    // Building the Message
    // const msg = {
    //   from: req.user.email,
    //   to,
    //   subject,
    //   message,
    // };

    // Send the Mssage
    sendMail(req.user.email, "adcomtechcomp@gmail.com", subject, message);

    // Save the Email
    const sentEmail = await EmailMsg.create({
      from: req.user.email,
      to,
      subject,
      message,
      sentBy: req.user.id,
    });

    // Send Response
    res.status(201).json({
      status: "success",
      sentEmail,
      message: "Email Successfully Sent",
    });
  } catch (error) {
    res.send(error);
  }
});

export const getAllEmail = catchAsyncErrors(async (req, res, next) => {
  const emails = await EmailMsg.find();

  res.status(200).json({
    status: "success",
    result: emails.length,
    emails,
  });
});

export const getEmail = catchAsyncErrors(async (req, res, next) => {
  const email = await EmailMsg.findById(req.params.id);

  if (!email)
    return next(new HandleAppErrors("No Email Found with the ID", 404));

  res.status(200).json({
    status: "success",
    email,
  });
});

export const deleteEmail = catchAsyncErrors(async (req, res, next) => {
  const email = await EmailMsg.findByIdAndDelete(req.params.id);

  if (!email)
    return next(new HandleAppErrors("No Email Found with the ID", 404));

  res.status(204).json({
    status: "success",
    message: "You have Successfully Deleted the User",
  });
});
