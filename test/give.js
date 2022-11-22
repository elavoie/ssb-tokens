var tape = require('tape')
var meta = require('../')
var util = require('util')
var Decimal = require('decimal.js')


module.exports = function run (ssb) {
  tape('give: incorrect with invalid number source', function (t) {
    ssb.identities.create(function (err, id) {
    t.error(err)

    ssb.tokens.give(12, id, function (err, msg) {
    t.true(err)
    t.end()
    }) })
  })

  tape('give: correct with only source id', function (t) {
    ssb.tokens.create(1, 'Give Shell', function (err, createMsg) {
    t.error(err)

    ssb.identities.create(function (err, id) {
    t.error(err)

    ssb.tokens.give(createMsg.key, id, function (err, giveMsg) {
    t.error(err)
    t.end()
    }) }) })
  })

  tape('give: correct with missing source amount', function (t) {
    ssb.tokens.create(1, 'Give Shell', function (err, createMsg) {
    t.error(err)

    ssb.identities.create(function (err, id) {
    t.error(err)

    ssb.tokens.give({ id: createMsg.key }, id, function (err, giveMsg) {
    t.error(err)
    t.end()
    }) }) })
  })

  tape('give: incorrect with missing source id', function (t) {
    ssb.tokens.create(1, "Give Shell", function (err, createMsg) {
    t.error(err)

    ssb.identities.create(function (err, id) {
    t.error(err)

    ssb.tokens.give({ amount: 1 }, id, function (err, giveMsg) {
    t.true(err)
    t.true(err.id)
    t.true(err.tokenType)
    t.end()
    }) }) })
  })

  
  tape('give: incorrect with invalid operation-id', function (t) {
    ssb.tokens.create(1, 'Give Shell', function (err, createMsg) {
    t.error(err)

    ssb.identities.create(function (err, id) {
    t.error(err)

    ssb.tokens.give('blabla', id, function (err, giveMsg) {
    t.true(err)
    t.true(err.id)
    t.end()
    }) }) })
  })


  tape('give: correct with operation-id', function (t) {
    ssb.tokens.create(1, 'Give Shell', function (err, createMsg) {
    t.error(err)

    ssb.identities.create(function (err, id) {
    t.error(err)

    ssb.tokens.give(createMsg.key, id, function (err, giveMsg) {
    t.error(err)
    t.end()
    }) }) })
  })

  tape('give: correct with amount and operation id', function (t) {
    ssb.tokens.create(1, 'Give Shell', function (err, createMsg) {
    t.error(err)

    ssb.identities.create(function (err, id) {
    t.error(err)

    ssb.tokens.give({ id: createMsg.key, amount: 1 }, id, function (err, giveMsg) {
    t.error(err)
    t.equal(giveMsg.value.content.amount, "1")
    t.end()
    }) }) })
  })

  tape('give: correct with string amount and operation id', function (t) {
    ssb.tokens.create(1, 'Give Shell', function (err, createMsg) {
    t.error(err)

    ssb.identities.create(function (err, id) {
    t.error(err)

    ssb.tokens.give({ id: createMsg.key, amount: "1" }, id, function (err, giveMsg) {
    t.error(err)
    t.equal(giveMsg.value.content.amount, "1")
    t.end()
    }) }) })
  })

  tape('give: correct with Decimal amount and operation id', function (t) {
    ssb.tokens.create(1, 'Give Shell', function (err, createMsg) {
    t.error(err)

    ssb.identities.create(function (err, id) {
    t.error(err)

    ssb.tokens.give({ id: createMsg.key, amount: Decimal("1") }, id, function (err, giveMsg) {
    t.error(err)
    t.equal(giveMsg.value.content.amount, "1")
    t.end()
    }) }) })
  })

  tape('give: incorrect with invalid tokenType', function (t) {
    ssb.tokens.create(1, 'Give Invalid TokenType', function (err, createMsg) {
    t.error(err)

    ssb.identities.create(function (err, id) {
    t.error(err)

    var badTokenType = createMsg.value.content.tokenType  + 'bad'

    ssb.tokens.give(
    { tokenType: badTokenType }, 
    id, function (err, giveMsg) {
    t.true(err)
    t.true(err.tokenType)
    t.end()
    }) }) })
  })

  tape('give: incorrect with tokenType with no operation', function (t) {
    ssb.identities.create(function (err, id) {
    t.error(err)

    var emptyTokenType = 'abcdef0123456789'

    ssb.tokens.give(
    { tokenType: emptyTokenType }, 
    id, function (err, giveMsg) {
    t.true(err)
    t.true(err.sources)
    t.true(err.notFound)
    t.end()
    }) }) 
  })

  tape('give: correct with amount and tokenType', function (t) {
    ssb.tokens.create(2, 'GiveWAmntWTokType', function (err, createMsg) {
    t.error(err)

    ssb.identities.create(function (err, id) {
    t.error(err)

    ssb.tokens.give({ 
      amount: 1,
      tokenType: createMsg.value.content.tokenType
    }, id, function (err, giveMsg) {
    t.error(err)
    var op = giveMsg.value.content
    t.ok(op)
    t.equal(Number(op.amount), 1)
    t.equal(op.sources.length, 1)
    t.equal(op.sources[0].id, createMsg.key)
    t.equal(Number(op.sources[0].amount), 1)
    t.equal(op.tokenType, createMsg.value.content.tokenType)
    t.end()
    }) }) })
  })

  tape('give: correct w/o amount and w/ tokenType', function (t) {
    ssb.tokens.create(2, 'GiveWOAmntWTokType', function (err, createMsg) {
    t.error(err)

    ssb.identities.create(function (err, id) {
    t.error(err)

    ssb.tokens.give({ 
      tokenType: createMsg.value.content.tokenType
    }, id, function (err, giveMsg) {
    t.error(err)
    var op = giveMsg.value.content
    t.ok(op)
    t.equal(Number(op.amount), 2)
    t.equal(op.sources.length, 1)
    t.equal(op.sources[0].id, createMsg.key)
    t.equal(Number(op.sources[0].amount), 2)
    t.equal(op.tokenType, createMsg.value.content.tokenType)
    t.end()
    }) }) })
  })

  tape('give: correct from multiple sources with tokenType', function (t) {
    ssb.tokens.create(1, 'GiveMultTokenType', function (err, createMsg1) {
    t.error(err)

    ssb.tokens.create(1, 'GiveMultTokenType', function (err, createMsg2) {
    t.error(err)

    ssb.identities.create(function (err, id) {
    t.error(err)

    ssb.tokens.give({ 
      tokenType: createMsg1.value.content.tokenType
    }, id, function (err, giveMsg) {
    t.error(err)
    var op = giveMsg.value.content
    t.ok(op)
    var sourceIds = { } 
    sourceIds[createMsg1.key] = true
    sourceIds[createMsg2.key] = true 
    t.equal(Number(op.amount), 2)
    t.equal(op.sources.length, 2)
    t.ok(op.sources[0].id in sourceIds)
    t.equal(Number(op.sources[0].amount), 1)
    t.ok(op.sources[1].id in sourceIds)
    t.equal(Number(op.sources[1].amount), 1)
    t.end()
    }) }) }) })
  })

  tape('give: incorrect insufficient funds', function (t) {
    ssb.tokens.create(1, 'GiveInsufficientFunds', function (err, createMsg) {
    t.error(err)

    ssb.identities.create(function (err, id) {
    t.error(err)

    ssb.tokens.give({ 
      amount: 2, tokenType: 
      createMsg.value.content.tokenType
    }, id, function (err, giveMsg) {
    t.true(err)
    t.true(err.sources)
    t.true(err.unspent)
    t.true(err.insufficient)
    t.end()
    }) }) })
  })

  tape('give: incorrect spent funds', function (t) {
    ssb.tokens.create(1, 'GiveSpentFunds', function (err, createMsg) {
    t.error(err)

    ssb.identities.create(function (err, id) {
    t.error(err)

    var tokenType = createMsg.value.content.tokenType
    ssb.tokens.give({ 
      amount: 1, 
      tokenType: tokenType 
    }, id, function (err, giveMsg1) {
    t.error(err)    

    ssb.tokens.give({ 
      amount: 1, 
      tokenType: tokenType 
    }, id, function (err, giveMsg2) {
    t.true(err)    
    t.true(err.sources)
    t.true(err.unspent)
    t.true(err.insufficient)
    t.end()
    }) }) }) })
  })

  tape('give: correct from multiple sources with operation id', function (t) {
    ssb.tokens.create(1, 'GiveMultipleOpId', function (err, createMsg1) {
    t.error(err)

    ssb.tokens.create(1, 'GiveMultipleOpId', function (err, createMsg2) {
    t.error(err)

    ssb.identities.create(function (err, receiver) {
    t.error(err)

    ssb.tokens.give([
      { amount: 1, id: createMsg1.key },
      { amount: 1, id: createMsg2.key }
    ], receiver, function (err, giveMsg) {
    t.error(err)
    var op = giveMsg.value.content 
    t.ok(op)
    t.equal(Number(op.amount), 2)
    var sourceIds = op.sources.map((s) => s.id)
    t.ok(sourceIds.indexOf(createMsg1.key) > -1)
    t.ok(sourceIds.indexOf(createMsg2.key) > -1)
    t.equal(op.tokenType, createMsg1.value.content.tokenType)
    t.equal(op.tokenType, createMsg2.value.content.tokenType)
    t.equal(op.receiver, receiver)
    t.end()
    }) }) }) })
  })

  tape('give: incorrect non-owned tokens', function (t) {
    ssb.tokens.create(1, 'NonOwnedTokens', function (err, createMsg) {
    t.error(err)

    ssb.identities.create(function (err, giver) {
    t.error(err)

    ssb.identities.create(function (err, receiver) {
    t.error(err)

    ssb.tokens.give(
    createMsg.key, 
    receiver, 
    { author: giver }, function (err, giveMsg) {
    t.true(err)
    t.true(err.notOwner)
    t.end()
    }) }) }) })
  })

  tape('give: incorrect with source operation not in local database', function (t) {
    var missing = "%2Wy4PB+8Fn5qeaZng4Lj5nteE+kAe6D58UKVhgiJfD4=.sha256"

    ssb.identities.create(function (err, receiver) {
    t.error(err)

    ssb.tokens.give(missing, receiver, function (err, giveMsg) {
    t.true(err)
    t.true(err.notFound)
    t.end()
    }) })
  })

  tape('give: correct without publishing', function (t) {
    ssb.tokens.create(2, 'GiveWOAmntWTokType', function (err, createMsg) {
    t.error(err)

    ssb.identities.create(function (err, id) {
    t.error(err)

    ssb.tokens.give({ 
      tokenType: createMsg.value.content.tokenType
    }, id, { publish: false }, function (err, giveMsg) {
      t.error(err)

      ssb.get(giveMsg.key, function (err) {
        t.true(err)
        t.end()
      })
    }) }) })
  })
}
