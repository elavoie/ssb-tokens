var tape = require('tape')
var util = require('util')

module.exports = function run (ssb) {
  var newID = util.promisify(ssb.identities.create)
  var create = util.promisify(ssb.tokens.create)
  var give = util.promisify(ssb.tokens.give)
  var list = util.promisify(ssb.tokens.list)

  tape('Scuttleflotilla Crowdfunding', function (t) {
    var initiator = null
    var backer = null
    var friend = null
    var creation = null
    var transfer = null

    newID().then( (id) => { initiator = id; t.ok(initiator) } )
    .then( () => newID() ).then( (id) => { backer = id; t.ok(backer) })
    .then( () => create(100, 'Alchemist Token', { owner: initiator }) )
    /*
    .then( (_creation) => {
      creation = _creation
      give(1, backer, 
                 { currency: 'Alchemist Token', 
                   owner: initiator 
                 }) 
    })
    .then( (_transfer) => {
      transfer = _transfer
      list(null, initiator)
    })
    .then( (initiatorTokens) => {
      t.equal(initiatorTokens.length, 1)
      
      // Correct balance and currency
      t.equal(initiatorTokens[0].currency, 'Alchemist Token')
      t.equal(initiatorTokens[0].balance, 99)

      // Correct operations
      t.equal(initiatorTokens[0].received.length, 1)
      t.equal(initiatorTokens[0].received[0].id, creation.id)
      t.equal(initiatorTokens[0].given.length, 1)
      t.equal(initiatorTokens[0].given[0].id, transfer.id)
      t.equal(initatorTokens[0].burnt.length, 0)

      list(null, backer)
    })
    .then( (backerTokens) => {
      t.equal(backerTokens.length, 1)

      // Correct balance and currency
      t.equal(backerTokens[0].currency, 'Alchemist Token')
      t.equal(backerTokens[0].balance, 1)

      // Correct operations
      t.equal(backerTokens[0].received.length, 1)
      t.equal(backerTokens[0].received[0].id, transfer.id)
      t.equal(backerTokens[0].given.length, 0)
      t.equal(backerTokens[0].burnt.length, 0)
    })
    */
    .then( () => t.end() )
    .catch(function (err) {
      console.log(err.stack)
      t.fail(err)
    })
  })
}
