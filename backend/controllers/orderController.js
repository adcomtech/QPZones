import { Order } from "../models/OrderModel.js";
import { catchAsyncErrors } from "../utils/catchAsyncErrors.js";
import HandleAppErrors from "../utils/handleAppError.js";

/******************************************
///* CREATE A NEW ORDER FUNCTIONALITY
 *****************************************/
export const createNewOrder = catchAsyncErrors(async (req, res, next) => {
  const {
    orderedItems,
    paymentInfo,
    totalPrice,
    itemsPrice,
    offlineUserInfo,
    orderStatus,
  } = req.body;

  // Get current Logged IN User
  const loggedInUser = await User.findOne({ email: req.user.email });

  const orderData = {
    offlineUserInfo,
    orderedItems,
    paymentInfo,
    itemsPrice,
    totalPrice,
    paidAt: Date.now(),
    orderStatus,
    // orderedBy: req.user._id,
  };

  let newOrder;

  if (loggedInUser) {
    newOrder = await Order.create({
      ...orderData,
      orderedBy: req.user.id,
    });
  } else {
    newOrder = await Order.create({
      orderData,
    });
  }

  res.status(201).json({
    status: "success",
    order: newOrder,
  });
});

/******************************************
///* GET SINGLE ORDER FUNCTIONALITY
 *****************************************/
export const getUserSingleOrder = catchAsyncErrors(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order)
    next(new HandleAppErrors("No Order Item Found with the Provided ID!", 404));

  res.status(200).json({
    status: "success",
    order,
  });
});

/******************************************
///* GET ALL CURRENT USER ORDER FUNCTIONALITY
 *****************************************/
export const getAllUserOrders = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findOne({ email: req.user.email });
  if (!user) {
    return next(new HandleAppErrors("No User Found with That Email", 404));
  }

  const userOrders = await Order.find({ orderedBy: user._id });

  if (!userOrders)
    next(new HandleAppErrors("No Order Item Found with the Provided ID!", 404));

  res.status(200).json({
    status: "success",
    userOrders,
  });
});

/******************************************
///* GET ALL ORDER FUNCTIONALITY
 *****************************************/
export const getAllOrders = catchAsyncErrors(async (req, res, next) => {
  const orders = await Order.find();

  // Defining Total Amount of the Order
  let totalAmount = 0;

  orders.forEach((order) => (totalAmount += order.totalPrice));

  res.status(200).json({
    status: "success",
    totalOrders: orders.length,
    totalAmount,
    orders,
  });
});

/******************************************
///* UPDATE ORDER STATUS FUNCTIONALITY
 *****************************************/
export const updateOrderStatus = catchAsyncErrors(async (req, res, next) => {
  // console.log(req.body);
  // return;
  const { orderId, orderStatus } = req.body;

  let updated = await Order.findByIdAndUpdate(
    orderId,
    { orderStatus },
    { new: true }
  );

  res.status(200).json({
    status: "success",
    message: "Order Status has been Updated Successfully",
  });
});

/******************************************
///* DELTE ORDER  FUNCTIONALITY
 *****************************************/
export const deleteOrder = catchAsyncErrors(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order)
    next(new HandleAppErrors("No Order Found with the Provided ID"), 404);

  order.deleteOne();

  res.status(200).json({
    status: "success",
    message: "Order has been Successfully Deleted",
  });
});

/******************************************
///* GET LATEST ORDER FUNCTIONALITY
 *****************************************/
export const getLatestOrders = catchAsyncErrors(async (req, res, next) => {
  const query = req.query.new;

  const latestOrders = query
    ? await Order.find().sort({ _id: -1 }).limit(4)
    : await Order.find().sort({ _id: -1 });

  res.status(200).json(latestOrders);
});

/******************************************
///* GET  ORDER STATISTICS FUNCTIONALITY
 *****************************************/
export const getOrdersStats = catchAsyncErrors(async (req, res, next) => {
  // Calculating the Previous Month
  const previousMonth = moment()
    .month(moment().month() - 1)
    .set("date", 1)
    .format("DD-MM-YYYY HH:mm:ss");

  const orders = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: new Date(previousMonth) },
      },
    },

    // Seting a field in our collection in this case user colleciton
    {
      $project: {
        month: { $month: "$createdAt" },
      },
    },

    // grouping our user data based on a particular month got from the project up above
    {
      $group: {
        _id: "$month",
        total: { $sum: 1 }, // this adds up the found group of data
      },
    },
  ]);

  res.status(200).json({
    status: "success",
    orders,
  });
});

/******************************************
///*GET INCOME OR EARNINGS STATISTICS FUNCTIONALITY
 *****************************************/
export const getIncomeStats = catchAsyncErrors(async (req, res, next) => {
  // Calculating the Previous Month
  const previousMonth = moment()
    .month(moment().month() - 1)
    .set("date", 1)
    .format("DD-MM-YYYY HH:mm:ss");

  const incomes = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: new Date(previousMonth) },
      },
    },

    // Seting a field in our collection in this case order colleciton
    {
      $project: {
        month: { $month: "$createdAt" },
        sales: "$count",
      },
    },

    // grouping our order data based on a particular month got from the project up above
    {
      $group: {
        _id: "$month",
        total: { $sum: "$sales" }, // this adds up the found group of data
      },
    },
  ]);

  res.status(200).json({
    status: "success",
    incomes,
  });
});

/******************************************
///* // GET DAYS OF THE WEEK INCOME OR EARNINGS STATISTICS uisng graph
 *****************************************/
export const getWeeklySalesStats = catchAsyncErrors(async (req, res, next) => {
  // Calculating the Previous Month
  const last7Days = moment()
    .day(moment().day() - 7)
    .format("DD-MM-YYYY HH:mm:ss");

  const weeklySales = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: new Date(last7Days) },
      },
    },

    // Seting a field in our collection in this case order colleciton
    {
      $project: {
        day: { $dayOfWeek: "$createdAt" },
        sales: "$count",
      },
    },

    // grouping our order data based on a particular month got from the project up above
    {
      $group: {
        _id: "$day",
        total: { $sum: "$sales" }, // this adds up the found group of data
      },
    },
  ]);

  res.status(200).json({
    status: "success",
    weeklySales,
  });
});
