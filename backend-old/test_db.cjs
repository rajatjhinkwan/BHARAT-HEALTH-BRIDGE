const mongoose = require('mongoose');
const uri = "mongodb+srv://rajatjhinkwan947_db_user:IQkpRxEzppFmflQG@swath-dhan.lysu1bc.mongodb.net/bhb?retryWrites=true&w=majority&appName=SWATH-DHAN";

mongoose.connect(uri)
  .then(() => {
    console.log("Connected successfully.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Connection error:", err.message);
    process.exit(1);
  });
