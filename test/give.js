var tape = require('tape')
var meta = require('../')
var util = require('util')


module.exports = function run (ssb) {

  var create = util.promisify(ssb.tokens.create)
  var newID = util.promisify(ssb.identities.create)
  var give = util.promisify(ssb.tokens.give)

  tape('give with invalid number source', function (t) {
    newID().then((id) => give(12, id))
    .then(() => {
      t.fail("Should error")
      t.end()
    })
    .catch((err) => {
      t.true(err)
      t.end()
    })
  })

  tape('give with missing source amount', function (t) {
    var created = null
    create(1, 'Give Shell')
    .then( (_created) => { created = _created; return newID() })
    .then( (id)       => give({ id: created.id }, id) )
    .then((op) => {
      t.ok(op)
      t.end()
    })
    .catch((err) => {
      t.false(err)
      t.end()
    })
  })

  tape('give with missing source id', function (t) {
    var created = null
    create(1, 'Give Shell')
    .then( (_created) => { created = _created; return newID() })
    .then( (id)       => give({ amount: 1 }, id) )
    .then(() => {
      t.fail("Should error")
      t.end()
    })
    .catch((err) => {
      t.true(err)
      t.end()
    })
  })

  tape('give with missing source id', function (t) {
    var created = null
    create(1, 'Give Shell')
    .then( (_created) => { created = _created; return newID() })
    .then( (id)       => give({ amount: 1 }, id) )
    .then((op) => {
      console.log(op)
      t.fail("Should error")
    })
    .catch((err) => {
      t.true(err)
      t.end()
    })
  })
  
  tape('give with invalid operation-id', function (t) {
    var created = null
    create(1, 'Give Shell')
    .then( (_created) => { created = _created; return newID() })
    .then( (id)       => give('blabla', id) )
    .then((op) => {
      console.log(op)
      t.fail("Should error")
    })
    .catch((err) => {
      t.true(err)
      t.end()
    })
  })


  tape('give with operation-id', function (t) {
    var created = null
    create(1, 'Give Shell')
    .then( (_created) => { created = _created; return newID() })
    .then( (id)       => give(created.id, id) )
    .then((op) => {
      t.ok(op)
      t.end()
    })
    .catch((err) => {
      console.log(err.stack)
      t.fail(err)
      t.end()
    })
  })

  tape('give with amount and operation id', function (t) {
    var created = null
    create(1, 'Give Shell')
    .then( (_created) => { created = _created; return newID() })
    .then( (id)       => give({ amount: 1, id: created.id }, id) )
    .then((op) => {
      t.ok(op)
      t.end()
    })
    .catch((err) => {
      console.log(err.stack)
      t.fail(err)
      t.end()
    })
  })

  tape('give with invalid token-hash', function (t) {
    var created = null
    create(2, 'give with invalid token-hash')
    .then( (_created) => { created = _created; return newID() })
    .then( (id)       => give({ amount: 1, "token-hash": created["token-hash"] + 'bad' }, id) )
    .then((op) => {
      console.log(op)
      t.fail('Should fail')
      t.end()
    })
    .catch((err) => {
      t.true(err)
      t.end()
    })
  })

  tape('give with amount and token-hash', function (t) {
    var created = null
    create(2, 'give w/ amount&token-hash')
    .then( (_created) => { created = _created; return newID() })
    .then( (id)       => give({ amount: 1, "token-hash": created["token-hash"] }, id) )
    .then((op) => {
      t.ok(op)
      t.equal(op.amount, 1)
      t.equal(op.source.length, 1)
      t.equal(op.source[0].id, created.id)
      t.end()
    })
    .catch((err) => {
      console.log(err.stack)
      t.fail(err)
      t.end()
    })
  })

  tape('give w/o amount&token-hash', function (t) {
    var created = null
    create(1, 'give w/o amount&token-hash')
    .then( (_created) => { created = _created; return newID() })
    .then( (id)       => give({ "token-hash": created["token-hash"] }, id) )
    .then((op) => {
      t.ok(op)
      t.equal(op.amount, 1)
      t.equal(op.source.length, 1)
      t.equal(op.source[0].id, created.id)
      t.end()
    })
    .catch((err) => {
      console.log(err.stack)
      t.fail(err)
      t.end()
    })
  })

  tape('give from multiple sources with token-hash', function (t) {
    var created1 = null
    var created2 = null
    var currency = 'give many sources token-hash'
    create(1, currency)
    .then( (_created) => { 
      created1 = _created; 
      return create(1, currency)
    })
    .then ((_created) => {
      created2 = _created 
      return newID() 
    })
    .then( (id) => give({ "token-hash": created1["token-hash"] }, id) )
    .then( (op) => {
      t.ok(op)
      var sourceIds = { } 
      sourceIds[created1["id"]] = true
      sourceIds[created2["id"]] = true 
      t.equal(op.amount, 2)
      t.equal(op.source.length, 2)
      t.ok(op.source[0].id in sourceIds)
      t.ok(op.source[1].id in sourceIds)
      t.end()
    })
    .catch((err) => {
      console.log(err.stack)
      t.fail(err)
      t.end()
    })
  })

  tape('give insufficient funds', function (t) {
    var created = null
    create(1, 'give insufficient funds')
    .then( (_created) => { created = _created; return newID() } )
    .then( (id)       => give({ amount: 2, "token-hash": created["token-hash"] }, id) )
    .then( (op)       => {
      t.fail("Should error")
      t.end()
    })
    .catch((err) => {
      t.true(err)
      t.end()
    })
  })

  tape('give spent funds', function (t) {
    var created = null
    var receiver = null
    create(1, 'give spent funds')
    .then( (_created) => { created = _created; return newID() } )
    .then( (id)       => give({ amount: 1, "token-hash": created["token-hash"] }, receiver=id) )
    .then( ()         => give({ amount: 1, "token-hash": created["token-hash"] }, receiver) )
    .then( (op)       => {
      t.fail("Should error")
      t.end()
    })
    .catch((err) => {
      t.true(err)
      t.end()
    })
  })


  tape('give from multiple sources with operation id', function (t) {
    var created1 = null
    var created2 = null
    var receiver = null
    create(1, 'give multiple op-id')
    .then( (_created) => { created1 = _created; return create(1, 'give multiple op-id') } )
    .then( (_created) => { created2 = _created; return newID() } )
    .then( (id)       => give([{ amount: 1, id: created1.id }, 
                               { amount: 1, id: created2.id }], receiver=id) )
    .then( (op)       => {
      t.ok(op)
      t.equal(op.amount, 2)
      var sourceIds = op.source.map((s) => s.id)
      t.ok(sourceIds.indexOf(created1.id) > -1)
      t.ok(sourceIds.indexOf(created2.id) > -1)
      t.equal(op["token-hash"], created1["token-hash"])
      t.equal(op["token-hash"], created2["token-hash"])
      t.equal(op.recipient, receiver)
      t.end()
    })
    .catch((err) => {
      console.log(err.stack)
      t.fail(err)
      t.end()
    })
  })

  tape('give non-owned tokens', function (t) {
    var created = null
    var giver = null
    var receiver = null
    create(1, 'non-owned token')
    .then( (_created) => { created = _created; return newID() } )
    .then( (id) => { giver = id; return newID() } )
    .then( (id) => give(created.id, receiver=id, { owner: giver }) )
    .then( (op) => {
      t.fail("Should error")
      t.end()
    })
    .catch((err) => {
      t.true(err)
      t.end()
    })
  })
}
