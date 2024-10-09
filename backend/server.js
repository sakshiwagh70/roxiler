const express = require("express");
const axios = require("axios");
const Item = require("./prod.js"); // Ensure this is the correct path to your model

const router = express.Router();

// Map month names to numbers
const MONTHS_MAP = {
  January: 1, February: 2, March: 3, April: 4,
  May: 5, June: 6, July: 7, August: 8,
  September: 9, October: 10, November: 11, December: 12,
};

// Middleware for validating the month input
const validateMonth = (req, res, next) => {
  const { month } = req.query;
  if (!month) {
    return res.status(400).send({ error: "Month is required." });
  }

  const monthNumber = MONTHS_MAP[month] || parseInt(month);
  if (monthNumber < 1 || monthNumber > 12) {
    return res.status(400).send({ error: "Invalid month." });
  }

  req.monthNumber = monthNumber; // Store month number for later use
  next();
};

// Route to seed the database
router.post("/add", async (req, res) => {
  try {
    const { data } = await axios.get(process.env.THIRD_PARTY_API);
    const items = data.map(({ title, price, description, sold, dateOfSale }) => ({
      title,
      price,
      description,
      sold,
      dateOfSale,
    }));

    await Item.deleteMany({});
    await Item.insertMany(items);

    res.status(201).send({ message: "Database seeded successfully." });
  } catch (error) {
    console.error("Seeding error:", error);
    res.status(500).send({ error: "Failed to seed database." });
  }
});

// Function to get sales data for a specific month
const getSalesData = async (monthNumber) => {
  return Item.aggregate([
    { $match: { $expr: { $eq: [{ $month: "$dateOfSale" }, monthNumber] } } },
    {
      $group: {
        _id: null,
        totalSales: { $sum: { $cond: [{ $eq: ["$sold", true] }, "$price", 0] } },
        soldCount: { $sum: { $cond: [{ $eq: ["$sold", true] }, 1, 0] } },
        notSoldCount: { $sum: { $cond: [{ $eq: ["$sold", false] }, 1, 0] } },
        totalCount: { $sum: 1 },
      },
    },
  ]);
};

// Route to fetch items and total sales data
router.get("/prods", validateMonth, async (req, res) => {
  try {
    const items = await Item.find({
      $expr: { $eq: [{ $month: "$dateOfSale" }, req.monthNumber] },
    });

    const totals = await getSalesData(req.monthNumber);
    res.status(200).json({ items, totals: totals[0] });
  } catch (error) {
    console.error("Fetch items error:", error);
    res.status(500).send({ error: "Failed to fetch items." });
  }
});

// Helper function to categorize price ranges
const getPriceRange = (price) => {
  if (price <= 100) return "0-100";
  if (price <= 200) return "101-200";
  if (price <= 300) return "201-300";
  if (price <= 400) return "301-400";
  if (price <= 500) return "401-500";
  if (price <= 600) return "501-600";
  if (price <= 700) return "601-700";
  if (price <= 800) return "701-800";
  if (price <= 900) return "801-900";
  return "901-above";
};

// Route to get combined data
router.get("/prods/combined", validateMonth, async (req, res) => {
  try {
    const monthNumber = req.monthNumber;
    const [salesData, priceData, categoryData] = await Promise.all([
      getSalesData(monthNumber),
      Item.aggregate([
        { $match: { $expr: { $eq: [{ $month: "$dateOfSale" }, monthNumber] } } },
        {
          $group: {
            _id: null,
            priceRanges: {
              $push: {
                $cond: [
                  { $lt: ["$price", 100] }, "0-100",
                  { $cond: [{ $lt: ["$price", 200] }, "101-200", "201-above"] }
                ],
              },
            },
          },
        },
      ]),
      Item.aggregate([
        { $match: { $expr: { $eq: [{ $month: "$dateOfSale" }, monthNumber] } } },
        {
          $group: {
            _id: "$category",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    res.status(200).json({
      salesSummary: salesData[0],
      priceRangeDistribution: priceData,
      categoryDistribution: categoryData,
    });
  } catch (error) {
    console.error("Combined data fetch error:", error);
    res.status(500).send({ error: "Failed to fetch combined data." });
  }
});

module.exports = router;
