class ApiFeatures {
  constructor(query, queryStr) {
    (this.query = query), (this.queryStr = queryStr);
  }

  filter() {
    const queryCopy = { ...this.queryStr };

    // Removing some field for category
    const removeFields = ["keyword", "page", "limit", "sort", "fields"];

    removeFields.forEach((key) => delete queryCopy[key]);

    this.query = this.query.find(queryCopy);
    return this;
  }

  search() {
    const keyword = this.queryStr.keyword
      ? {
          title: {
            $regex: this.queryStr.keyword,
            $options: "i",
          },
        }
      : {};

    this.query = this.query.find({ ...keyword });
    return this;
  }

  searchUser() {
    const keyword = this.queryStr.keyword
      ? {
          name: {
            $regex: this.queryStr.keyword,
            $options: "i",
          },
        }
      : {};

    this.query = this.query.find({ ...keyword });
    return this;
  }

  sort() {
    if (this.queryStr.sort) {
      // Allows Sorting By Two or More Fields
      const sortBy = this.queryStr.sort.split(",").join(" "); // takes the sorted Fields and join by space
      this.query = this.query.sort(sortBy);
    } else {
      // Sorting by Date the Resource is Created
      this.query = this.query.sort("-createdAt");
    }
    return this;
  }

  // Allowing the Ability of selecting the Fields to Displacy or Hide
  limitFields() {
    if (this.queryStr.fields) {
      // Allows the Visibility of the Selected Fields  when specified in the Query
      const fields = this.queryStr.fields.split(",").join(" ");
      this.query = this.query.select(fields);
    } else {
      // Disabling some Fields in the Query when it is slected with Minus Sign verse vasa
      this.query = this.query.select("-__v");
    }
    return this;
  }

  pagination(resultPerPage) {
    // Determine the current Page By Converting the QueryString to Number
    const currentPage = Number(this.queryStr.page) || 1;
    // Define the Number of Page to Skip
    const skip = resultPerPage * (currentPage - 1);

    // Deine the Query
    this.query = this.query.limit(resultPerPage).skip(skip);
    return this;
  }
}

export default ApiFeatures;
