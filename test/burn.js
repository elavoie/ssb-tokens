var tape = require('tape')
var meta = require('../')
var util = require('util')

module.exports = function run (ssb) {
  var create = util.promisify(ssb.tokens.create)
  var give = util.promisify(ssb.tokens.give)
  var burn = util.promisify(ssb.tokens.burn)
  var newID = util.promisify(ssb.identities.create)

  tape('api.burn: with operation-id', function (t) {
    var created = null
    create(1, 'burn with operation-id')
    .then( (op) => {
      return burn( (created=op).id ) 
    })
    .then( (op) => {
      t.ok(op)
      t.equal(op['token-hash'], created['token-hash'])
      t.equal(op.amount, created.amount)
      t.equal(op.source.length, 1)
      t.equal(op.source[0], created.id)
      t.end()
    })
    .catch( (err) => {
      console.log(err.stack)
      t.fail(err)
      t.end()
    })
  })

  tape('api.burn: with invalid operation-id', function (t) {
    burn(2)
    .then( (op) => {
      t.fail("Should fail")
      t.end()
    })
    .catch( (err) => {
      t.true(err)
      t.end()
    })
  })

  tape('api.burn: with invalid array of operation-id', function (t) {
    burn([2])
    .then( (op) => {
      t.fail("Should fail")
      t.end()
    })
    .catch( (err) => {
      t.true(err)
      t.end()
    })
  })

  tape('api.burn: with many operation-id', function (t) {
    var created1 = null
    var created2 = null
    var currency = 'burn with many op-id'
    create(1, currency)
    .then( (_created) => { created1 = _created; return create(1, currency) } )
    .then( (_created) => {
      created2 = _created
      return burn( [created1.id, created2.id] ) 
    })
    .then( (op) => {
      t.ok(op)
      t.equal(op['token-hash'], created1['token-hash'])
      t.equal(op['token-hash'], created2['token-hash'])
      t.equal(op.amount, created1.amount + created2.amount)
      t.equal(op.source.length, 2)
      t.ok(op.source.indexOf(created1.id) > -1)
      t.ok(op.source.indexOf(created2.id) > -1)
      t.end()
    })
    .catch( (err) => {
      console.log(err.stack)
      t.fail(err)
      t.end()
    })
  })

  tape('api.burn: with partially given source', function (t) {
    var created = null
    var receiver = null
    create(2, 'burn with partial source')
    .then( (op) => { created = op; return newID() } )
    .then( (id) => { receiver = id; return give({ amount: 1, id: created.id }, receiver) } )
    .then( (op) => burn( created.id ) )
    .then( (op) => {
      t.fail("Should fail")
      t.end()
    })
    .catch( (err) => {
      t.true(err)
      t.end()
    })
  })

  tape('api.burn: already burnt tokens', function (t) {
    var created = null
    create(2, 'burn with partial source')
    .then( (op) => burn( (created=op).id ) )
    .then( (op) => burn( created.id ) )
    .then( (op) => {
      t.fail("Should fail")
      t.end()
    })
    .catch( (err) => {
      t.true(err)
      t.end()
    })
  })

  tape('api.burn: non-owned tokens', function (t) {
    var created = null
    create(2, 'burn non-owned tokens')
    .then( (op) => { created=op; return newID() })
    .then( (nonOwner) => burn( created.id , { owner: nonOwner }) )
    .then( (op) => {
      t.fail("Should fail")
      t.end()
    })
    .catch( (err) => {
      t.true(err)
      t.end()
    })
  })

}
