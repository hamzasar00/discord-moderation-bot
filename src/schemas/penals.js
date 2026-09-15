const { createJsonModel } = require('./jsonModel.js');

module.exports = createJsonModel('penals', {
  id: 0,
  userID: '',
  guildID: '',
  type: '',
  active: true,
  staffID: '',
  reason: '',
  temp: false,
  date: Date.now,
  removed: false,
});