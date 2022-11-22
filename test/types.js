var tape = require('tape')
var util = require('../src/util')

module.exports = function (ssb) {

  tape('types: incorrect callback', function (t) {
    try {
      ssb.tokens.types('string')
    } catch (err) {
      t.true(err)
      t.end()
    }
  })

  tape('types: incorrect options', function (t) {
    ssb.tokens.types('string', function (err, types) {
      t.true(err)
      t.end()
    })
  })

  tape('types: incorrect options.match', function (t) {
    ssb.tokens.types({ match: 'string' }, function (err, types) {
      t.true(err)
      t.end()
    })
  })

  tape('types: incorrect options.match.author', function (t) {
    ssb.tokens.types({ match: { author: 'hello' } }, function (err, types) {
      t.true(err)
      t.end()
    })
  })

  tape('types: incorrect options.match.description', function (t) {
    ssb.tokens.types({ match: { description: 1 } }, function (err, types) {
      t.true(err)
      t.end()
    })
  })

  tape('types: correct author matching', function (t) {
    ssb.identities.create(function (err, author) {
      t.error(err)

      ssb.tokens.create(1, { name: "Types Token", author: author }, function (err, msg) {
        t.error(err)

        ssb.tokens.types({ match: { author: author } }, function (err, types) {
          t.error(err)
          var op = msg.value.content
          var tokenType = op.tokenType
          t.ok(types[msg.value.content.tokenType])
          t.equal(types[tokenType].author, msg.value.author)
          t.equal(types[tokenType].description, op.description)
          t.equal(types[tokenType].name, op.name)
          t.equal(types[tokenType].unit, op.unit)
          t.end()
        })
      })
    })
  })

  tape('types: correct matching multiple tokens', function (t) {
    ssb.identities.create(function (err, author) {
      t.error(err)

      ssb.tokens.create(
        1, 
        { name: "Type 1", unit: "USD", author: author }, function (err, msg1) {
        t.error(err)

        ssb.tokens.create(
          1, 
          { name: "Type 2", unit: "USD", author: author }, function (err, msg2) {
          t.error(err)

          ssb.tokens.types(
            { match: { author: author, unit: "USD" } }, function (err, types) {
            t.error(err)

            var tokenType1 = msg1.value.content.tokenType
            t.ok(types[tokenType1])
            t.equal(types[tokenType1].name, "Type 1")
            var tokenType2 = msg2.value.content.tokenType
            t.ok(types[tokenType2])
            t.equal(types[tokenType2].name, "Type 2")
            t.end()
          })
        })
      })

    })
  })

  tape('types: correct matching all types', function (t) {
    ssb.tokens.types(function (err, types) {
      t.error(err)
      t.ok(Object.keys(types).length > 1)
      t.end()
    })
  })

  tape('types: correct filtering of invalid message', function (t) {
    ssb.identities.create(function (err, author) {
      t.error(err)

      var op = {
        type: util.createType,
        amount: "-1",            // Invalid negative amount
        name: "Invalid Token",
        description: null,
        unit: ""
      }
      op.tokenType = ssb.tokens.tokenType(author, op)

      ssb.identities.publishAs({
        id: author,
        content: op,
      }, function (err, msg) {
        t.error(err)

        ssb.tokens.types({ match: { author: author } }, function (err, types) {
          t.error(err)        
          t.false(types[msg.value.content.tokenType])
          t.end()
        })
      })
    })
  })

  tape('types: correct matching without validation', function (t) {
    ssb.identities.create(function (err, author) {
      t.error(err)

      var op = {
        type: util.createType,
        amount: "-1",            // Invalid negative amount
        name: "Invalid Token",
        description: null,
        unit: ""
      }
      op.tokenType = ssb.tokens.tokenType(author, op)

      ssb.identities.publishAs({
        id: author,
        content: op,
      }, function (err, msg) {
        t.error(err)

        ssb.tokens.types({ match: { author: author }, validate: false }, function (err, types) {
          t.error(err)        
          t.true(types[msg.value.content.tokenType])
          t.end()
        })
      })
    })
  })
}
