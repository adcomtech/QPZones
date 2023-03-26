import jwt from "jsonwebtoken";

export const createActivationToken = (seller) => {
  return jwt.sign(seller, process.env.JWT_ACTIVATION_TOKEN_SECRET, {
    expiresIn: Date.now() + 10 * 60 * 1000, // 10 MINUTES
  });
};

export const verifyActivationToken = (activation_token) => {
  return jwt.verify(activation_token, process.env.JWT_ACTIVATION_TOKEN_SECRET);
};
