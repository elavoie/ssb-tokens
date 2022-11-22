var tape = require('tape')
var meta = require('../')
var Decimal = require('decimal.js')

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

  tape('create: valid string token amount', function (t) {
    ssb.tokens.create('10', 'Shells', function (err, msg) {
      t.false(err)
      t.equal(msg.value.content.amount, "10")
      t.end()
    })
  })

  tape('create: valid number token amount', function (t) {
    ssb.tokens.create(10, 'Shells', function (err, msg) {
      t.false(err)
      t.equal(msg.value.content.amount, "10")
      t.end()
    })
  })
  
  tape('create: valid floating-point token amount', function (t) {
    ssb.tokens.create(10.1, 'Shells', function (err, msg) {
      t.false(err)
      t.equal(msg.value.content.amount, "10.1")
      t.end()
    })
  })

  tape('create: valid Decimal token amount', function (t) {
    ssb.tokens.create(Decimal(10), 'Shells', function (err, msg) {
      t.false(err)
      t.equal(msg.value.content.amount, "10")
      t.end()
    })
  })

  tape('create: valid Decimal floating-point amount', function (t) {
    ssb.tokens.create(Decimal(10.001), 'Shells', 
      function (err, msg) {
        t.false(err)
        t.equal(msg.value.content.amount, "10.001")
        t.end()
      })
  })

  tape('create: valid Decimal 78 significant digits', function (t) {
    var amount = Decimal('1.' + '0'.repeat(76) + '1')
    ssb.tokens.create(amount, 'Shells', 
      function (err, msg) {
        t.false(err)
        t.equal(msg.value.content.amount, amount.toString())
        t.end()
      })
  })

  tape('create: valid string 78 significant digits', function (t) {
    var amount = '1.' + '0'.repeat(76) + '1'
    ssb.tokens.create(amount, 'Shells', 
      function (err, msg) {
        t.false(err)
        t.equal(msg.value.content.amount, amount)
        t.end()
      })
  })

  tape('create: invalid Decimal 79 significant digits (max 78)', function (t) {
    var amount = Decimal('1.' + '0'.repeat(77) + '1')
    ssb.tokens.create(amount, 'Shells', 
      function (err, msg) {
        t.true(err)
        t.true(err.amount)
        t.end()
      })
  })

  tape('create: invalid 79 significant digits string (max 78)', function (t) {
    var amount = '1.' + '0'.repeat(77) + '1'
    ssb.tokens.create(amount, 'Shells', 
      function (err, msg) {
        t.true(err)
        t.true(err.amount)
        t.end()
      })
  })


  tape('create: invalid negative number token amount', function (t) {
    ssb.tokens.create(-10, 'Shells', function (err, msg) {
      t.true(err)
      t.true(err.amount)
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
      t.equal(op.amount, '10')
      t.equal(op.name, 'Shells')
      t.equal(op.unit, '')
      t.equal(op.description, null)
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
        t.equal(op.amount, '10')
        t.equal(op.name, 'Shells')
        t.equal(op.unit, '')
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
          t.equal(op.amount, '10')
          t.equal(op.name, 'Shells')
          t.equal(op.unit, '')
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
