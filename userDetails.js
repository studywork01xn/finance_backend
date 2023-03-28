const mongoose = require("mongoose");

const UserDetailsScehma = new mongoose.Schema(
  {
    fname: String,
    lname: String,
    email: { type: String, unique: true },
    password: String,
    userType: String,
    income: Number,
  },
  {
    collection: "UserInfo",
  }
);

const ExpensesSchema = new mongoose.Schema(
  {
    expenseName: String,
    category: String,
    date: Date,
    time: String,
    amount: Number,
    userId: String,
    month: String,
  },
  {
    collection: "Expenses",
  }
);
mongoose.model("UserInfo", UserDetailsScehma);
mongoose.model("Expenses", ExpensesSchema);
