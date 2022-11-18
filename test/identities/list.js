var tape = require('tape')
var ssbKeys = require('ssb-keys')
var pull = require('pull-stream')

module.exports = function (ssb) {

  tape('list: correct list own identities', function (t) {
    ssb.tokens.identities.create(function (err, created) {
      t.error(err)

      ssb.tokens.identities.list({ own: true }, function (err, ids) {
        t.error(err)

        t.true(ids.indexOf(created.id) > -1)
        t.true(ids.indexOf(ssb.id) > -1)
        t.end()
      })
    })
  })

  tape('list: correct list own identities with tokenType', function (t) {
    ssb.tokens.identities.create({ alias: 'alice' }, function (err, alice) {
      t.error(err)

      ssb.tokens.identities.create({ alias: 'bob' }, function (err, bob) {
        t.error(err)

        ssb.tokens.create(1, { name: "Alice Token", author: alice.id }, function (err, msg) {
          t.error(err)

          ssb.tokens.identities.list({ own: true, used: true }, function (err, ids) {
            t.error(err)

            t.true(ids.indexOf(alice.id) > -1)
            t.equal(ids.indexOf(bob.id), -1)
            t.end()
          })
        })
      })
    })
  })

  tape('list: correct list all identities used for token operations', function (t) {
    ssb.tokens.identities.create({ alias: 'alice' }, function (err, alice) {
      t.error(err)

      // Create an id that is owned but does not use ssb-tokens
      ssb.tokens.identities.create({ alias: 'bob' }, function (err, bob) {
        t.error(err)

        // Create an id that is not owned (not seen by the
        // require('../identities') module) but participates in operations
        var roger = ssbKeys.generate()

        ssb.tokens.create(1, { name: "Alice Token", author: alice.id }, function (err, msg) {
          t.error(err)

          ssb.tokens.give(msg.key, roger.id, { author: alice.id }, function (err, msg) {
            t.error(err)

            ssb.tokens.identities.list({ used: true }, function (err, ids) {
              t.error(err)

              t.true(ids.indexOf(alice.id) > -1)
              t.true(ids.indexOf(roger.id) > -1)
              t.equal(ids.indexOf(bob.id), -1)
              t.end()
            })
          })
        })
      })
    })
  })

  tape('list: correct list all identities appearing in ssb messages', function (t) {
    ssb.tokens.identities.create(function (err, alice) {
      t.error(err)

      ssb.tokens.identities.create(function (err, bob) {
        t.error(err)

        ssb.identities.publishAs({
          id: alice.id,
          content: {
            type: 'empty',
          },
          private: false
        }, function (err, msg) {
          t.error(err)

          ssb.tokens.identities.list(function (err, ids) {
            t.error(err)

            t.true(ids.indexOf(alice.id) > -1)
            t.true(ids.indexOf(bob.id) > -1)

            t.end()
          })
        })
      })
    })
  })
}
