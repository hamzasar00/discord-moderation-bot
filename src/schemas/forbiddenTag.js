const { createJsonModel } = require('./jsonModel.js');

module.exports = createJsonModel('forbiddenTag', {
  guildID: '',
  forbiddenTags: [],
});