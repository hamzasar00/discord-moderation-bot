const { Schema, model } = require("mongoose");

const penalCounters = Schema({
  guildID: { type: String, unique: true, required: true },
  value: { type: Number, default: 0 },
});

module.exports = model("penalCounters", penalCounters);