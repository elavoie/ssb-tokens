var meta = require('../')

var apiVersion = "J9oN"

module.exports = {
  'api-version': apiVersion,
  createType: 'tokens/' + apiVersion + '/create',
  giveType: 'tokens/' + apiVersion + '/give',
  burnType: 'tokens/' + apiVersion + '/burn',
  flagType: 'tokens/' + apiVersion + '/flag',
  unflagType: 'tokens/' + apiVersion + '/unflag',

  isCreate: function (op) {
    return op.type === module.exports.createType 
  },

  isGive: function (op) {
    return op.type === module.exports.giveType 
  },

  isBurn: function (op) {
    return op.type === module.exports.burnType
  },

  isFlag: function (op) {
    return op.type === module.exports.flagType
  },

  isUnflag: function (op) {
    return op.type === module.exports.unflagType
  },

  isOp: function (op) {
    return module.exports.isCreate(op) || 
           module.exports.isGive(op)   || 
           module.exports.isBurn(op)   || 
           module.exports.isFlag(op)   ||
           module.exports.isUnflag(op)
  }
}
