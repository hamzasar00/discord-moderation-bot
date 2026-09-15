const { createJsonModel } = require('./jsonModel.js');

module.exports = createJsonModel('afk', {
  guildID: '',
  userID: '',
  reason: '',
  date: Date.now,
});