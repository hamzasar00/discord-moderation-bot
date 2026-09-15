const { createJsonModel } = require('./jsonModel.js');

module.exports = createJsonModel('snipe', {
  guildID: '',
  channelID: '',
  authorID: '',
  userID: '',
  messageContent: '',
  image: '',
  deletedDate: Date.now,
});