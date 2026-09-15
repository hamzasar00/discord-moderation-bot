const { createJsonModel } = require('./jsonModel.js');

module.exports = createJsonModel('administrators', {
  type: '',
  guildID: '',
  roleID: '',
  userID: '',
  userRoles: [],
  roleMembers: [],
  reason: 'Belirtilmedi!',
});