var tape = require('tape')
var meta = require('../')
var util = require('util')

module.exports = function run (ssb) {

  tape('valid: correct', function (t) {
    ssb.tokens.create(1, "Shells", function (err, msg) {
      t.false(err)

      ssb.tokens.valid(msg, function (err, msg) {
        t.false(err)
        t.end()
      })
    })
  })

  tape('valid: not a message', function (t) {
    ssb.tokens.create(1, "Shells", function (err, msg) {
      t.false(err)

      ssb.tokens.valid(msg.value, function (err, msg) {
        t.true(err)
        t.end()
      })
    })
  })

  tape('valid: inconsistent message key and value', function (t) {
    ssb.tokens.create(1, "Shells", function (err, msg) {
      t.false(err)

      var invalidKey = '%invalidkey' + msg.key.slice(11)
      msg.key=invalidKey

      ssb.tokens.valid(msg, function (err, msg) {
        t.true(err)
        t.end()
      })
    })
  })

  tape('valid: memoization of valid message', function (t) {
    ssb.tokens.create(1, "Shells", function (err, msg) {
      t.false(err)

      ssb.tokens.valid(msg, function (err, msg) {
        t.false(err)
        t.true(ssb.tokens.validate.cache.validated(msg))
        t.end()
      })
    })
  })

  tape('valid: memoization of invalid message', function (t) {
    ssb.identities.create(function (err, author) {
      t.false(err)

      var invalidOp = {
        type: "tokens/" + meta['api-version'] + "/create", 
        amount: -1, // Invalid negative amount
        name: "Shells",
        unit: "",
        decimals: 0,
        description: null
      }
      invalidOp.tokenType = ssb.tokens.tokenType(author, invalidOp)

      ssb.identities.publishAs({
        id: author,
        content: invalidOp,
        private: false
      }, function (err, msg) {
        t.false(err)

        ssb.tokens.valid(msg, function (err, msg) {
          t.true(err)
          t.true(ssb.tokens.validate.cache.validated(msg))
          t.end()
        })
      })
    })
  })

  tape('valid: clearing of cache', function (t) {
    ssb.tokens.create(1, "Shells", function (err, msg) {
      t.false(err)

      ssb.tokens.valid(msg, function (err, msg) {
        t.false(err)
        t.true(ssb.tokens.validate.cache.validated(msg))
        ssb.tokens.validate.cache.clear()
        t.false(ssb.tokens.validate.cache.validated(msg))
        t.end()
      })
    })
  })

  tape('valid: serialize and restore cache', function (t) {
    ssb.tokens.create(1, "Shells", function (err, msg) {
      t.false(err)

      ssb.tokens.valid(msg, function (err, msg) {
        t.false(err)
        t.true(ssb.tokens.validate.cache.validated(msg))
        var serialized = ssb.tokens.validate.cache.serialize()
        ssb.tokens.validate.cache.clear()
        t.false(ssb.tokens.validate.cache.validated(msg))
        ssb.tokens.validate.cache.restore(serialized)
        t.true(ssb.tokens.validate.cache.validated(msg))
        t.end()
      })
    })
  })
}
