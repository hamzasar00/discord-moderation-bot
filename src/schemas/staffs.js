const { createJsonModel } = require('./jsonModel.js');

module.exports = createJsonModel('staffs', {
  guildID: '',
  authorID: '',
  staffName: '',
  staffs: [],
  staffRoles: [],
  date: Date.now,
});