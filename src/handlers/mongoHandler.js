const mongoose = require("mongoose");
const { MongoURL } = global.client.settings;

if (!MongoURL) {
  console.error("[DATABASE] MONGO_URL is not configured. Database features are unavailable.");
} else mongoose.connect(MongoURL, {
  useUnifiedTopology: true,
  useNewUrlParser: true,
  useFindAndModify: false,
}).catch(() => {});

mongoose.connection.on("connected", () => console.log("[DATABASE] Connected To Database"));
mongoose.connection.on("error", () => console.error("[DATABASE] Failed To Connect Database"));