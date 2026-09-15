const { createJsonModel } = require('./jsonModel.js');

module.exports = createJsonModel('alarms', {
  guildID: '',
  userID: '',
  channelID: '',
  reason: '',
  startDate: Date.now,
  finishDate: Date.now,
  finished: false,
});