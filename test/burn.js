var tape = require('tape')
var meta = require('../')

module.exports = function run (ssb) {
  tape('burn: with operation-id', function (t) {
    ssb.tokens.create(1, 'burn with operation-id', function (err, createMsg) {
    t.error(err)

    ssb.tokens.burn(createMsg.key, function (err, burnMsg) {
    t.error(err)
  
    var op = burnMsg.value.content
    t.ok(op)
    t.equal(op.tokenType, createMsg.value.content.tokenType)
    t.equal(op.amount, createMsg.value.content.amount)
    t.equal(op.sources.length, 1)
    t.equal(op.sources[0].id, createMsg.key)
    t.equal(op.sources[0].amount, 1)
    t.end()
    }) })
  })

  tape('burn: incorrect with invalid operation-id', function (t) {
    ssb.tokens.burn(2, function (err, burnMsg) {
    t.true(err)
    t.end()
    })
  })

  tape('burn: incorrect with invalid array of operation-id', function (t) {
    ssb.tokens.burn([2], function (err, burnMsg) {
    t.true(err)
    t.end()
    })
  })

  tape('burn: correct with many operation-id', function (t) {
    var name = 'burn with many op-id'
    ssb.tokens.create(1, name, function (err, createMsg1) {
    t.error(err)

    ssb.tokens.create(1, name, function (err, createMsg2) {
    t.error(err)

    var sourceIds = [ createMsg1.key, createMsg2.key ]
    ssb.tokens.burn(sourceIds, function (err, burnMsg) {
    t.error(err)

    var op = burnMsg.value.content
    t.ok(op)
    t.equal(op.tokenType, createMsg1.value.content.tokenType)
    t.equal(op.tokenType, createMsg2.value.content.tokenType)
    t.equal(op.amount, createMsg1.value.content.amount + 
                        createMsg2.value.content.amount)
    t.equal(op.sources.length, 2)
    t.ok(sourceIds.indexOf(op.sources[0].id) > -1)
    t.ok(sourceIds.indexOf(op.sources[1].id) > -1)
    t.end()
    }) }) })
  })

  tape('burn: incorrect with partially given source', function (t) {
    ssb.tokens.create(2, 'burn with partial source', function (err, createMsg) {
    t.error(err)

    ssb.identities.create(function (err, receiver) {
    t.error(err)

    ssb.tokens.give(
    { amount: 1, id: createMsg.key }, 
    receiver, function (err, giveMsg) {
    t.error(err)

    ssb.tokens.burn(createMsg.key, function (err, burnMsg) {
    t.true(err)
    t.end()
    }) }) }) })
  })

  tape('burn: incorrect already burnt tokens', function (t) {
    ssb.tokens.create(2, 'burn with burnt source', function (err, createMsg) {
    t.error(err)

    ssb.tokens.burn(createMsg.key, function (err, burnMsg) {
    t.error(err)

    ssb.tokens.burn(createMsg.key, function (err, burnMsg2) {
    t.true(err)
    t.end()
    }) }) })
  })

  tape('burn: incorrect non-owned tokens', function (t) {
    ssb.tokens.create(2, 'burn non-owned tokens', function (err, createMsg) {
    t.error(err)

    ssb.identities.create(function (err, nonOwner) {
    t.error(err)

    ssb.tokens.burn(createMsg.key, { author: nonOwner }, function (err) {
    t.true(err)
    t.end()
    }) }) })
  })

  tape('burn: missing source', function (t) {
    var missing = "%2Wy4PB+8Fn5qeaZng4Lj5nteE+kAe6D58UKVhgiJfD4=.sha256"

    ssb.tokens.burn(missing, function (err) {
    t.true(err)
    t.end()
    })
  })

  tape('burn: correct without publishing', function (t) {
    ssb.tokens.create(1, 'burn with operation-id', function (err, createMsg) {
    t.error(err)

    ssb.tokens.burn(createMsg.key, { publish: false }, function (err, burnMsg) {
    t.error(err)

    ssb.get(burnMsg.key, function (err) {
      t.true(err)
      t.end()
    })
    }) })
  })
}
