var tape = require('tape')

module.exports = function (ssb) {

  tape('owner: invalid callback', function (t) {
    try {
      ssb.tokens.owner('hello')
      t.fail('should fail')
    } catch (err) {
      t.true(err)
      t.end()
    }
  })

  tape('owner: invalid message id', function (t) {
    ssb.tokens.owner('hello', function (err, owner) {
      t.true(err)
      t.end()
    })
  })

  tape('owner: invalid message', function (t) {
    ssb.publish({ type: "hello world" }, function (err, msg) {
      t.error(err)

      ssb.tokens.owner(msg.key, function (err, owner) {
        t.true(err)
        t.end()
      })
    })
  })

  tape('owner: invalid burn operation', function (t) {
    ssb.tokens.create(1, "Owner Token", function (err, msg) {
      t.error(err)

      ssb.tokens.burn(msg.key, function (err, msg) {
        t.error(err)

        ssb.tokens.owner(msg.key, function (err, owner) {
          t.true(err)
          t.end()
        })
      })
    })
  })

  tape('owner: correct create operation', function (t) {
    ssb.tokens.create(1, "Owner Token", function (err, msg) {
      t.error(err)

      ssb.tokens.owner(msg.key, function (err, owner) {
        t.error(err)
        t.equal(owner, msg.value.author)
        t.end()
      })
    })
  })

  tape('owner: correct give operation', function (t) {
    ssb.identities.create(function (err, receiver) {
      t.error(err)

      ssb.tokens.create(1, "Giveable Token", function (err, msg) {
        t.error(err)

        ssb.tokens.give(msg.key, receiver, function (err, msg) {
          t.error(err)

          ssb.tokens.owner(msg.key, function (err, owner) {
            t.error(err)
            t.equal(owner, msg.value.content.receiver)
            t.end()
          })
        })
      })
    })
  })
}
