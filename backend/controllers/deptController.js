import { Department } from "../models/DeptModel.js";
import { Topic } from "../models/TopicModel.js";
import ApiFeatures from "../utils/ApiFeatures.js";
import { catchAsyncErrors } from "../utils/catchAsyncErrors.js";
import HandleAppErrors from "../utils/handleAppError.js";
import { validateMongodbId } from "../utils/validateID.js";

// CREATE A DEPARTMENT
export const createDepartment = catchAsyncErrors(async (req, res, next) => {
  const newDepartment = await Department.create(req.body);

  res.status(201).json({
    status: "success",
    department: newDepartment,
  });
});

// GET ALL THE DEPARTMENTS
export const getAllDepartments = catchAsyncErrors(async (req, res, next) => {
  // Set of Users to Display Per Page
  const resultPerPage = 10;

  // Count Total Number of Users in the Document
  const totalNumOfDept = await Department.countDocuments();

  // Querying User Collection Based on the API Feaures
  const feature = new ApiFeatures(Department.find(), req.query)
    .filter()
    .searchUser()
    .sort()
    .limitFields()
    .pagination(resultPerPage);

  // Find all the Department
  // const departments = await Department.find({}).sort({ createdAt: -1 });
  const departments = await feature.query;

  if (!departments)
    return next(new HandleAppErrors("No Departments Found", 404));
  // Send the Response
  res.status(200).json({
    status: "success",
    numDeptInDoc: totalNumOfDept,
    results: departments.length,
    departments,
  });
});

// GET A DEPARTMENT
export const getDeptDetails = catchAsyncErrors(async (req, res, next) => {
  // Find the Department by Slug
  const department = await Department.findById(req.params.id);

  // checking if the Department the client is trying to assess exist
  if (!department) {
    return next(
      new HandleAppErrors("No department found with the ID Provided", 404)
    );
  }

  const topics = await Topic.find({ department }).populate("department");

  // checking if the Department the client is trying to assess exist
  if (!topics) {
    return next(new HandleAppErrors("No Topics found on this Department", 404));
  }

  // Sets the Number of Topics Allocates ta the Department
  department.topicCount = topics.length;

  // Send the Response
  res.status(200).json({
    status: "success",
    department,
    topics,
  });
});

// UPDATE A DEPARTMENT
export const updateDepartment = catchAsyncErrors(async (req, res, next) => {
  // Destructuring the Id
  const { id } = req.params;

  // Checking if the Id is Valid
  validateMongodbId(id);

  // Find the Department by Id
  const updatedDepartment = await Department.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  });

  // checking if the Department the client is trying to assess exist
  if (!updatedDepartment) {
    return next(
      new HandleAppErrors("No Department Found with ID Provided", 400)
    );
  }

  // Send the Response
  res.status(200).json({
    status: "success",
    department: updatedDepartment,
  });
});

// DELETE A DEPARTMENT
export const deleteDepartment = catchAsyncErrors(async (req, res, next) => {
  // Destructuring the Id
  const { id } = req.params;

  // Checking if the Id is Valid
  validateMongodbId(id);

  // Find the Department by deptSlug
  const deletedDepartment = await Department.findByIdAndDelete(id);

  // checking if the Department the client is trying to assess exist
  if (!deletedDepartment) {
    return next(
      new HandleAppErrors("No Department Found with ID Provided", 400)
    );
  }

  // Send the Response
  res.status(204).json({
    status: "success",
    department: null,
  });
});
