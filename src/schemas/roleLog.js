const { createJsonModel } = require('./jsonModel.js');

module.exports = createJsonModel('roleLog', {
  type: '',
  guildID: '',
  staffID: '',
  userID: '',
  roleID: '',
  date: Date.now,
});