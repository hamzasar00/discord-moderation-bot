const { createJsonModel } = require('./jsonModel.js');

module.exports = createJsonModel('penalPoints', {
  guildID: '',
  userID: '',
  penalPoint: 0,
});