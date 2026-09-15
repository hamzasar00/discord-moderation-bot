const { createJsonModel } = require('./jsonModel.js');

module.exports = createJsonModel('reload', {
  type: 'moderation',
  authorID: '',
  channelID: '',
  messageID: '',
});