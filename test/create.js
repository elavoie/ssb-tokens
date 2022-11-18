var tape = require('tape')
var meta = require('../')

module.exports = function run (ssb) {
  tape('create: no callback', function (t) {
    try {
      ssb.tokens.create()
      t.fail('should throw')
      t.end()
    } catch (e) {
      t.ok(e)
      t.end()
    }
  })

  tape('create: invalid token amount', function (t) {
    ssb.tokens.create('10', 'Shells', function (err, msg) {
      t.true(err)
      t.end()
    })
  })

  tape('create: invalid name', function (t) {
    ssb.tokens.create(10, 20, function (err, msg) {
      t.true(err)
      t.end()
    })
  })

  tape('create: invalid name length', function (t) {
    ssb.tokens.create(
      10, 
      'this is a very long currency string', function (err, msg) {
      t.true(err)
      t.end()
    })
  })

  tape('create: 10 Shells with no options', function (t) {
    ssb.tokens.create(10, 'Shells', function (err, msg) {
      t.false(err)

      var author = msg.value.author
      var op = msg.value.content
      t.equal(op.type, 'tokens/' + meta['api-version'] + '/create')
      t.equal(op.amount, 10)
      t.equal(op.name, 'Shells')
      t.equal(op.unit, '')
      t.equal(op.description, null)
      t.equal(op.decimals, 0)
      t.equal(op.tokenType, ssb.tokens.tokenType(author, op))
      t.end()
    })
  })

  tape('create: different owner', function (t) {
    ssb.identities.create(function (err, newLogId) {
      t.notOk(err)
      ssb.tokens.create(10, { 
        name: "Shells",
        author: newLogId
      }, function (err, msg) {
        t.false(err)

        var author = msg.value.author
        var op = msg.value.content
        t.equal(author, newLogId)
        t.equal(op.type, 'tokens/' + meta['api-version'] + '/create')
        t.equal(op.amount, 10)
        t.equal(op.name, 'Shells')
        t.equal(op.unit, '')
        t.equal(op.decimals, 0)
        t.equal(op.description, null)
        t.equal(op.tokenType, ssb.tokens.tokenType(newLogId, op))
        t.end()
      })
    })
  })

  tape('create: use description', function (t) {
    ssb.publish({ 
      type: 'post', 
      text: '#Shells Tokens\n' +
            'This is my new awesome token!' 
    }, function (err, descMsg) {
      t.false(err)

      ssb.tokens.create(
        10, 
        { name: 'Shells', description: descMsg.key }, 
        function (err, msg) {
          t.false(err)

          var op = msg.value.content
          t.equal(op.type, 'tokens/' + meta['api-version'] + '/create')
          t.equal(op.amount, 10)
          t.equal(op.name, 'Shells')
          t.equal(op.unit, '')
          t.equal(op.decimals, 0)
          t.equal(op.description, descMsg.key)
          t.end()
        })
    })
  })

  tape('create: use an invalid description', function (t) {
    ssb.tokens.create(10, { name: 'Shells', description: '%malformed_id'}, 
      function (err, msg) {
        t.true(err)
        t.end()
      })
  })

  tape('create: use an invalid amount/decimals combination', function (t) {
    ssb.tokens.create(10.001, { name: 'Shells', decimals: 1 }, 
      function (err, msg) {
        t.true(err)
        t.end()
      })
  })

  tape('create: correct without publishing', function (t) {
    ssb.tokens.create(1, { name: 'Shells', publish: false }, 
      function (err, msg) {
        t.false(err)

        ssb.get(msg.key, function (err) {
          t.true(err)
          t.end()
        })
      })
  })
}
