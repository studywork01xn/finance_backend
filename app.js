require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;
const cors = require("cors");
const bcrypt = require("bcryptjs");
const brain = require("brain.js");

function generateMoneySavingTip(expenses, monthlySalary) {
  const categories = [
    "Food and Drinks",
    "Groceries",
    "Rent or Mortgage",
    "Utilities",
    "Transportation",
    "Personal care",
    "Clothing and Accessories",
    "Entertainment",
    "Travel",
    "Gifts and Donations",
    "Medical and Health",
    "Insurance",
    "Education",
    "Home Maintenance and Repairs",
    "Miscellaneous",
  ];

  // Calculate the total amount spent on each category
  const categoryAmounts = {};
  categories.forEach((category) => (categoryAmounts[category] = 0));
  expenses.forEach((expense) => {
    const category = expense.category;
    const amount = expense.amount;
    categoryAmounts[category] += amount;
  });

  // Calculate the weightage of each category based on the total amount spent and monthly salary
  const categoryWeightages = {};
  categories.forEach((category) => {
    const amountSpent = categoryAmounts[category];
    categoryWeightages[category] = amountSpent / monthlySalary;
  });

  // Train a neural network to predict the weightage of each category
  const net = new brain.NeuralNetwork({
    inputSize: categories.length,
  });
  const trainingData = categories.map((category, i) => {
    const input = Array.from({ length: categories.length }, (_, j) =>
      j === i ? categoryWeightages[category] : 0
    );
    return {
      input,
      output: [1],
    };
  });
  net.train(trainingData);

  // Calculate the final weightage of each category based on the neural network prediction
  const prediction = net.run(Object.values(categoryWeightages));
  const finalWeightages = categories.map((category, i) => ({
    category,
    weightage: prediction[i],
  }));

  const tips = finalWeightages.map(({ category, weightage }) => {
    const amountSpent = categoryAmounts[category];
    const percentOfTotalExpenses = amountSpent
      ? (amountSpent / monthlySalary) * 100
      : 0;

    if (weightage > 0.5) {
      return `You spent very little on ${category} (${percentOfTotalExpenses.toFixed(
        2
      )}% of your monthly salary). Consider spending a bit more on ${category} to enjoy life more.`;
    } else if (weightage > 0.25) {
      return `You spent some money on ${category} (${percentOfTotalExpenses.toFixed(
        2
      )}% of your monthly salary). You may want to spend a bit more on ${category} to improve your quality of life.`;
    } else if (weightage > 0.1) {
      return `You didn't spend much on ${category} (${percentOfTotalExpenses.toFixed(
        2
      )}% of your monthly salary). Look for ways to spend a bit more on ${category} to enjoy life more.`;
    } else if (weightage > 0.05) {
      return `You spent a very small amount on ${category} (${percentOfTotalExpenses.toFixed(
        2
      )}% of your monthly salary). Make sure you're not sacrificing your quality of life by cutting back too much on ${category}.`;
    } else if (
      category === "Hospital" ||
      category === "Rent or Mortgage" ||
      category === "Insurance"
    ) {
      return `You spent a moderate amount on ${category} (${percentOfTotalExpenses.toFixed(
        2
      )}% of your monthly salary). Consider reviewing your expenses in this category to see if there are any opportunities to save money.`;
    } else if (percentOfTotalExpenses > 30) {
      return `You spent a lot on ${category} (${percentOfTotalExpenses.toFixed(
        2
      )}% of your monthly salary). Consider reducing your spending on ${category} to save more.`;
    } else if (percentOfTotalExpenses > 20) {
      return `You spent quite a bit on ${category} (${percentOfTotalExpenses.toFixed(
        2
      )}% of your monthly salary). Consider reducing your spending on ${category} to save more.`;
    } else if (percentOfTotalExpenses > 10) {
      return `You spent some money on ${category} (${percentOfTotalExpenses.toFixed(
        2
      )}% of your monthly salary). Keep an eye on your spending in this category to make sure it doesn't get out of control.`;
    } else {
      return `You didn't spend anything on ${category} (${percentOfTotalExpenses.toFixed(
        2
      )}% of your monthly salary). Consider spending a bit on ${category} (${percentOfTotalExpenses.toFixed(
        2
      )}% of your monthly salary). Keep up the good work!`;
    }
  });

  // Return a random tip from the generated tips
  return tips[Math.floor(Math.random() * tips.length)];
}

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const jwt = require("jsonwebtoken");
var nodemailer = require("nodemailer");

const JWT_SECRET = process.env.JWT_SECRET;
const mongoUrl = process.env.MONGO_URL;

mongoose
  .connect(mongoUrl, {
    useNewUrlParser: true,
  })
  .then(() => {
    console.log("Connected to database");
  })
  .catch((e) => console.log(e));

require("./userDetails");
require("./imageDetails");

const User = mongoose.model("UserInfo");
const Expense = mongoose.model("Expenses");
const Images = mongoose.model("ImageDetails");

app.get("/getSavingTip", async (req, res) => {
  const { email } = req.query;
  const expenses = await Array.from(
    await Expense.aggregate([
      { $match: { userId: email } },
      {
        $group: {
          _id: "$category",
          totalAmount: { $sum: "$amount" },
        },
      },
      {
        $project: {
          _id: 0,
          expenseName: "$_id",
          category: "$_id",
          amount: "$totalAmount",
        },
      },
    ])
  );

  const userIncome = await User.findOne({ email });

  const tip = generateMoneySavingTip(expenses, userIncome);
  console.log(tip);

  return res.send(tip);
});

app.get("/getBarChartData", async (req, res) => {
  const { email } = req.query;

  try {
    const result = await Expense.collection
      .aggregate([
        { $match: { userId: email } },
        { $match: {} },
        {
          $addFields: {
            month_number: {
              $switch: {
                branches: [
                  { case: { $eq: ["$month", "January"] }, then: 1 },
                  { case: { $eq: ["$month", "February"] }, then: 2 },
                  { case: { $eq: ["$month", "March"] }, then: 3 },
                  { case: { $eq: ["$month", "April"] }, then: 4 },
                  { case: { $eq: ["$month", "May"] }, then: 5 },
                  { case: { $eq: ["$month", "June"] }, then: 6 },
                  { case: { $eq: ["$month", "July"] }, then: 7 },
                  { case: { $eq: ["$month", "August"] }, then: 8 },
                  { case: { $eq: ["$month", "September"] }, then: 9 },
                  { case: { $eq: ["$month", "October"] }, then: 10 },
                  { case: { $eq: ["$month", "November"] }, then: 11 },
                  { case: { $eq: ["$month", "December"] }, then: 12 },
                ],
              },
            },
          },
        },
        {
          $group: {
            _id: "$month_number",
            totalAmount: { $sum: "$amount" },
          },
        },
        {
          $addFields: {
            month_name: {
              $switch: {
                branches: [
                  { case: { $eq: ["$_id", 1] }, then: "Jan" },
                  { case: { $eq: ["$_id", 2] }, then: "Feb" },
                  { case: { $eq: ["$_id", 3] }, then: "Mar" },
                  { case: { $eq: ["$_id", 4] }, then: "Apr" },
                  { case: { $eq: ["$_id", 5] }, then: "May" },
                  { case: { $eq: ["$_id", 6] }, then: "Jun" },
                  { case: { $eq: ["$_id", 7] }, then: "Jul" },
                  { case: { $eq: ["$_id", 8] }, then: "Aug" },
                  { case: { $eq: ["$_id", 9] }, then: "Sept" },
                  { case: { $eq: ["$_id", 10] }, then: "Oct" },
                  { case: { $eq: ["$_id", 11] }, then: "Nov" },
                  { case: { $eq: ["$_id", 12] }, then: "Dec" },
                ],
              },
            },
          },
        },
        {
          $sort: { _id: 1 },
        },
      ])
      .toArray();

    res.json(result);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server" });
  }
});

app.get("/getPieChartData", async (req, res) => {
  const { email } = req.query;
  const result = await Expense.aggregate([
    { $match: { userId: email } },
    {
      $group: {
        _id: "$category",
        totalAmount: { $sum: "$amount" },
      },
    },
    {
      $project: {
        category: "$_id",
        totalAmount: 1,
        _id: 0,
      },
    },
  ]).exec();

  return res.send(result);
});

app.get("/getCategoriesSpending", async (req, res) => {
  const { email } = req.query;
  Expense.aggregate([
    // Match expenses for specific user
    {
      $match: {
        userId: email,
      },
    },
    // Group by category and sum amounts
    {
      $group: {
        _id: "$category",
        totalAmount: { $sum: "$amount" },
      },
    },
    // Project the desired output fields
    {
      $project: {
        id: 1,
        category: "$_id",
        amount: "$totalAmount",
      },
    },
  ]).then((response) => {
    return res.send(response);
  });
});

app.get("/getTodayExpenses", async (req, res) => {
  const { email } = req.query;
  const today = new Date();
  const startOfDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);
  Expense.find({
    userId: email,
    date: {
      $gte: startOfDay,
      $lte: endOfDay,
    },
  }).then((result) => {
    return res.send(result);
  });
});

app.post("/deleteExpense", async (req, res) => {
  const { id } = req.body;
  const filter = { _id: new ObjectId(id) };
  const result = await Expense.deleteOne(filter);
  if (result.deletedCount > 0) {
    return res.send("Deleted Successfully");
  } else {
    return res.send("Error Encountered While Deleting");
  }
});

app.get("/getPreviousExpenses", async (req, res) => {
  const { email } = req.query;

  const today = new Date();
  const startOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const filter = {
    userId: email,
    date: { $lt: startOfToday },
  };
  const pipeline = [
    { $match: filter },
    {
      $group: {
        _id: {
          year: { $year: "$date" },
          month: { $month: "$date" },
          day: { $dayOfMonth: "$date" },
        },
        expenses: { $push: "$$ROOT" },
      },
    },
    {
      $project: {
        _id: {
          _date: {
            $dateFromParts: {
              year: "$_id.year",
              month: "$_id.month",
              day: "$_id.day",
            },
          },
        },
        expenses: 1,
      },
    },
    { $sort: { "_id._date": -1 } },
  ];

  Expense.aggregate(pipeline).then((result) => {
    return res.send(result);
  });
});

app.post("/saveExpense", async (req, res) => {
  const { expenseName, category, date, time, amount, userId, month } = req.body;

  console.log(req.body);

  if (!expenseName || !category || !date || !time || !amount || !userId) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    await Expense.create({
      expenseName,
      category,
      date,
      time,
      amount,
      userId,
      month,
    });

    return res.send({ status: "ok" });
  } catch (e) {
    return res.send({ status: e });
  }
});

app.post("/register", async (req, res) => {
  const { fname, lname, email, password, userType, income } = req.body;

  const encryptedPassword = await bcrypt.hash(password, 10);
  try {
    const oldUser = await User.findOne({ email });

    if (oldUser) {
      return res.json({ error: "User Exists" });
    }
    await User.create({
      fname,
      lname,
      email,
      password: encryptedPassword,
      userType,
      income,
    });
    res.send({ status: "ok" });
  } catch (error) {
    res.send({ status: "error" });
  }
});

app.post("/login-user", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email });

  if (!user) {
    return res.json({ error: "User Not found" });
  }
  if (await bcrypt.compare(password, user.password)) {
    const token = jwt.sign({ email: user.email }, JWT_SECRET, {
      expiresIn: "15m",
    });

    if (res.status(201)) {
      return res.json({ status: "ok", data: token });
    } else {
      return res.json({ error: "error" });
    }
  }
  res.json({ status: "error", error: "Invalid Password" });
});

app.post("/userData", async (req, res) => {
  const { token } = req.body;

  try {
    const user = jwt.verify(token, JWT_SECRET, (err, res) => {
      if (err) {
        return "token expired";
      }
      return res;
    });
    if (user == "token expired") {
      return res.send({ status: "error", data: "token expired" });
    }

    const useremail = user.email;
    User.findOne({ email: useremail })
      .then((data) => {
        res.send({ status: "ok", data: data });
      })
      .catch((error) => {
        res.send({ status: "error", data: error });
      });
  } catch (error) {}
});

app.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  try {
    const oldUser = await User.findOne({ email });
    if (!oldUser) {
      return res.json({ status: "User Not Exists!!" });
    }
    const secret = JWT_SECRET + oldUser.password;
    const token = jwt.sign({ email: oldUser.email, id: oldUser._id }, secret, {
      expiresIn: "5m",
    });
    const link = `http://localhost:5000/reset-password/${oldUser._id}/${token}`;
    var transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "adarsh438tcsckandivali@gmail.com",
        pass: "rmdklolcsmswvyfw",
      },
    });

    var mailOptions = {
      from: "youremail@gmail.com",
      to: "thedebugarena@gmail.com",
      subject: "Password Reset",
      text: link,
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email sent: " + info.response);
      }
    });
    console.log(link);
  } catch (error) {}
});

app.get("/reset-password/:id/:token", async (req, res) => {
  const { id, token } = req.params;
  const oldUser = await User.findOne({ _id: id });
  if (!oldUser) {
    return res.json({ status: "User Not Exists!!" });
  }
  const secret = JWT_SECRET + oldUser.password;
  try {
    const verify = jwt.verify(token, secret);
    res.render("index", { email: verify.email, status: "Not Verified" });
  } catch (error) {
    console.log(error);
    res.send("Not Verified");
  }
});

app.post("/reset-password/:id/:token", async (req, res) => {
  const { id, token } = req.params;
  const { password } = req.body;

  const oldUser = await User.findOne({ _id: id });
  if (!oldUser) {
    return res.json({ status: "User Not Exists!!" });
  }
  const secret = JWT_SECRET + oldUser.password;
  try {
    const verify = jwt.verify(token, secret);
    const encryptedPassword = await bcrypt.hash(password, 10);
    await User.updateOne(
      {
        _id: id,
      },
      {
        $set: {
          password: encryptedPassword,
        },
      }
    );

    res.render("index", { email: verify.email, status: "verified" });
  } catch (error) {
    console.log(error);
    res.json({ status: "Something Went Wrong" });
  }
});

app.get("/getAllUser", async (req, res) => {
  try {
    const allUser = await User.find({});
    res.send({ status: "ok", data: allUser });
  } catch (error) {
    console.log(error);
  }
});

app.post("/deleteUser", async (req, res) => {
  const { userid } = req.body;
  try {
    User.deleteOne({ _id: userid }, function (err, res) {
      console.log(err);
    });
    res.send({ status: "Ok", data: "Deleted" });
  } catch (error) {
    console.log(error);
  }
});

app.post("/upload-image", async (req, res) => {
  const { base64 } = req.body;
  try {
    await Images.create({ image: base64 });
    res.send({ Status: "ok" });
  } catch (error) {
    res.send({ Status: "error", data: error });
  }
});

app.get("/get-image", async (req, res) => {
  try {
    await Images.find({}).then((data) => {
      res.send({ status: "ok", data: data });
    });
  } catch (error) {}
});

app.get("/paginatedUsers", async (req, res) => {
  const allUser = await User.find({});
  const page = parseInt(req.query.page);
  const limit = parseInt(req.query.limit);

  const startIndex = (page - 1) * limit;
  const lastIndex = page * limit;

  const results = {};
  results.totalUser = allUser.length;
  results.pageCount = Math.ceil(allUser.length / limit);

  if (lastIndex < allUser.length) {
    results.next = {
      page: page + 1,
    };
  }
  if (startIndex > 0) {
    results.prev = {
      page: page - 1,
    };
  }
  results.result = allUser.slice(startIndex, lastIndex);
  res.json(results);
});

app.listen(5000, () => {
  console.log("Server Started");
});
