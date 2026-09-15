const { createJsonModel } = require('./jsonModel.js');

module.exports = createJsonModel('afk', {
  guildID: '',
  userID: '',
  reason: '',
  originalNickname: '',
  date: Date.now,
});