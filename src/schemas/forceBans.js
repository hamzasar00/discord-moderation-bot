const { createJsonModel } = require('./jsonModel.js');

module.exports = createJsonModel('forceBans', {
  guildID: '',
  userID: '',
  staffID: '',
});