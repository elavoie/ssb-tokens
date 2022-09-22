
var tape = require('tape')
var meta = require('../')
var util = require('util')


module.exports = function run (ssb) {
  // Nesting is getting crazy for the following tests, and there is only one
  // valid execution path so we align all operations at the same indentation
  // level

  tape('unspent: correct create', function (t) {
    ssb.tokens.create(10, 'Shells', function (err, msg) {
    t.error(err)

    ssb.tokens.unspent(msg.key, msg.value.author, function (err, unspent) {
    t.error(err)

    t.equal(unspent, 10)
    t.end()
    }) })
  })

  tape('unspent: correct create + give', function (t) {
    ssb.tokens.create(10, 'Shells', function (err, createMsg) {
    t.error(err)

    ssb.identities.create(function (err, rec) {
    t.error(err)

    ssb.tokens.give({ id: createMsg.key, amount: 1}, rec, function (err, giveMsg) {
    t.error(err)

    ssb.tokens.unspent(
    createMsg.key, 
    createMsg.value.author, function (err, unspent) {
    t.error(err)

    t.equal(unspent, 9)
    t.end()
    }) }) }) })
  })

  tape('unspent: correct create + give + burn', function (t) {
    ssb.tokens.create(10, 'Shells', function (err, createMsg) {
    t.error(err)

    ssb.identities.create(function (err, rec) {
    t.error(err)

    ssb.tokens.give(
    { id: createMsg.key, amount: 1}, 
    rec, function (err, giveMsg) {
    t.error(err)

    var author = createMsg.value.author
    ssb.tokens.give(
    { id: createMsg.key, amount: 9}, 
    author, function (err, giveMsg2) {
    t.error(err)

    ssb.tokens.burn(giveMsg2.key, function (err, burnMsg) {
    t.error(err)

    ssb.tokens.unspent(
    createMsg.key, 
    createMsg.value.author, function (err, unspent) {
    t.error(err)

    t.equal(unspent, 0)
    t.end()
    }) }) }) }) }) })
  })

  tape('unspent: correct received', function (t) {
    ssb.tokens.create(10, 'Shells', function (err, createMsg) {
    t.error(err)

    ssb.identities.create(function (err, rec) {
    t.error(err)

    ssb.tokens.give(
    { id: createMsg.key, amount: 1}, 
    rec, function (err, giveMsg) {
    t.error(err)

    ssb.tokens.unspent(giveMsg.key, rec, function (err, unspent) {
    t.error(err)

    t.equal(unspent, 1)
    t.end()
    }) }) }) })
  })

  tape('unspent: correct received + give', function (t) {
    ssb.tokens.create(10, 'Shells', function (err, createMsg) {
    t.error(err)

    ssb.identities.create(function (err, rec) {
    t.error(err)

    ssb.tokens.give(
    { id: createMsg.key, amount: 1}, 
    rec, function (err, giveMsg) {
    t.error(err)

    ssb.tokens.give(
    { id: giveMsg.key }, 
    createMsg.value.author, 
    { author: rec }, function (err, giveMsg2) {
    t.error(err)

    ssb.tokens.unspent(giveMsg.key, rec, function (err, unspent) {
    t.error(err)

    t.equal(unspent, 0)
    t.end()
    }) }) }) }) })
  })

  tape('unspent: correct received + give + burn', function (t) {
    ssb.tokens.create(10, 'Shells', function (err, createMsg) {
    t.error(err)

    ssb.identities.create(function (err, rec) {
    t.error(err)

    ssb.tokens.give(
    { id: createMsg.key, amount: 2}, 
    rec, function (err, giveMsg) {
    t.error(err)

    ssb.tokens.give(
    { id: giveMsg.key, amount: 1 }, 
    createMsg.value.author, 
    { author: rec }, function (err, giveMsg2) {
    t.error(err)

    ssb.tokens.give(
    { id: giveMsg.key, amount: 1 }, 
    rec, 
    { author: rec }, function (err, giveMsg3) {
    t.error(err)

    ssb.tokens.burn(
    giveMsg3.key,
    { author: rec }, function (err, burnMsg) {
    t.error(err)

    ssb.tokens.unspent(
    giveMsg.key, 
    rec, function (err, unspent) {
    t.error(err)

    t.equal(unspent, 0)
    t.end()
    }) }) }) }) }) }) }) 
  })

  tape('unspent: invalid callback', function (t) {
    try {
      ssb.tokens.unspent('msg', 'owner', 'cb')
    } catch (err) {
      t.true(err)
      t.end()
    }
  })

  tape('unspent: invalid message identifier', function (t) {
    ssb.tokens.unspent('msg', 'owner', function (err, unspent, msg) {
      t.true(err)
      t.end()
    })
  })

  tape('unspent: invalid owner', function (t) {
    ssb.tokens.create(1, 'Shells', function (err, msg) {
    t.error(err)

    ssb.tokens.unspent(msg.key, 'owner', function (err, unspent, msg) {
    t.true(err)
    t.end()
    }) })
  })

  tape('unspent: invalid seqno', function (t) {
    ssb.tokens.create(1, 'Shells', function (err, msg) {
    t.error(err)

    ssb.tokens.unspent(
    msg.key,
    msg.value.author, 
    'seqno', function (err, unspent, msg) {
    t.true(err)
    t.end()
    }) })
  })

  tape('unspent: message not found', function (t) {
    ssb.identities.create(function (err, author) {
    t.error(err)

    var missing = "%AwZg2JbJbhz7jlfhuxrAWi25EDeJGGhp8AVt76fJM7A=.sha256"

    ssb.tokens.unspent(
    missing,
    author, function (err, unspent, msg) {
    t.true(err)
    t.true(err.notFound)
    t.end()
    }) }) 
  })

  tape('unspent: msg id not a create or give operation', function (t) {
    ssb.publish({ type: 'custom' }, function (err, msg) {
    t.error(err)

    ssb.tokens.unspent(
    msg.key, 
    msg.value.author, function (err, unspent, msg) {
    t.true(err)
    t.end()
    }) })
  })

  tape('unspent: inconsistent owner and creator', function (t) {
    ssb.identities.create(function (err, owner) {
    t.error(err)

    ssb.tokens.create(1, 'Shells', function (err, msg) {
    t.error(err)

    ssb.tokens.unspent(msg.key, owner, function (err, unspent, msg) {
    t.true(err)
    t.end()
    }) }) })
  })

  tape('unspent: inconsistent owner and receiver', function (t) {
    ssb.identities.create(function (err, owner) {
    t.error(err)

    ssb.tokens.create(1, 'Shells', function (err, msg) {
    t.error(err)

    ssb.tokens.give({ id: msg.key }, owner, function (err, giveMsg) {
    t.error(err)

    ssb.tokens.unspent(
    giveMsg.key,
    msg.value.author, function (err, unspent, msg) {
    t.true(err)
    t.end()
    }) }) }) })
  })

  tape('unspent: invalid create operation in msg', function (t) {
    ssb.identities.create(function (err, author) {
    t.error(err)

    ssb.identities.publishAs({
      id: author,
      content: {
        type: 'tokens/' + meta['api-version'] + '/create',
        amount: 1,
        name: 'Shells',
        unit: '',
        decimals: 0,
        description: null,
        tokenType: 'invalidtype'
      }
    }, function (err, msg) {
    t.error(err)
      
    ssb.tokens.unspent(
    msg.key,
    author, function (err, unspent, msg) {
    t.true(err)
    t.end()
    }) }) })
  })
}
