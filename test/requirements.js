var tape = require('tape')
var meta = require('../')
var util = require('util')

module.exports = function run (ssb) {
  var newID = util.promisify(ssb.identities.create)
  var create = util.promisify(ssb.tokens.create)
  var give = util.promisify(ssb.tokens.give) 
  var burn = util.promisify(ssb.tokens.burn)
  var valid = util.promisify(ssb.tokens.valid)

  tape('requirements(createOp): correct', function (t) {
    newID()
    .then( (author) => {
      var createMsg = {
        author: author,
        content: {
          type: "tokens/" + meta["api-version"] + "/create",
          amount: 10,
          name: "Create Coin",
          unit: "CRC",
          decimals: 0,
          description: null
        }
      }
      createMsg.content.tokenType = ssb.tokens.tokenType(author, createMsg.content)
      ssb.tokens.validate.requirements(createMsg, function (err, msg) {
        t.false(err)
        t.end()
      })
    })
    .catch((err) => {
      t.false(err)
      t.end()
    })
  }) 

  tape('requirements(createOp): incorrect tokenType', function (t) {
    newID()
    .then( (author) => {
      var createMsg = {
        author: author,
        content: {
          type: "tokens/" + meta["api-version"] + "/create",
          amount: 10,
          name: "Create Coin",
          unit: "CRC",
          decimals: 0,
          description: null
        }
      }
      createMsg.content.tokenType = ssb.tokens.tokenType(author, createMsg.content)
      createMsg.content.tokenType = 'z' + createMsg.content.tokenType.slice(1)
      ssb.tokens.validate.requirements(createMsg, function (err, msg) {
        t.true(err)
        t.end()
      })
    })
    .catch((err) => {
      t.false(err)
      t.end()
    })
  }) 

  tape('requirements(giveOp): correct', function (t) {
    ssb.tokens.create(10, 'Shells', function (err, msg) {
      t.false(err)

      var giveMsgValue = {
        author: msg.value.author,
        content: {
          type: "tokens/" + meta['api-version'] + "/give",
          sources: [ { id: msg.key, amount: 1 } ],
          receiver: msg.value.author,
          amount: 1,
          description: null,
          tokenType: msg.value.content.tokenType
        }
    }

      ssb.tokens.validate.requirements(giveMsgValue, function (err, msg) {
        t.false(err)
        t.end()
      })
    })
  })

  tape('requirements(giveOp): incorrect source operation', function (t) {
    ssb.publish({ 
      type: "custom",
    }, function (err, msg) {
      var giveMsgValue = {
        author: msg.value.author,
        content: {
          type: "tokens/" + meta['api-version'] + "/give",
          sources: [ { id: msg.key, amount: 1 } ],
          receiver: msg.value.author,
          amount: 1,
          description: null,
          tokenType: 'abcdef1234567890'
        }
      }

      ssb.tokens.validate.requirements(giveMsgValue, function (err, msg) {
        t.true(err)
        t.end()
      })
    })
  })

  tape('requirements(giveOp): incorrect source with the right type', function (t) {
    ssb.publish({ 
      type: "tokens/" + meta["api-version"] + "/create",
      amount: 10,
      name: "Create Coin",
      unit: "CRC",
      decimals: 0,
      description: null,
      tokenType: 'abcdef0123456789' // Invalid token type
    }, function (err, msg) {
      var giveMsgValue = {
        author: msg.value.author,
        content: {
          type: "tokens/" + meta['api-version'] + "/give",
          sources: [ { id: msg.key, amount: 1 } ],
          receiver: msg.value.author,
          amount: 1,
          description: null,
          tokenType: 'abcdef1234567890'
        }
      }

      ssb.tokens.validate.requirements(giveMsgValue, function (err, msg) {
        t.true(err)
        t.end()
      })
    })
  })

  tape('requirements(giveOp): inconsistent tokenType', function (t) {
    ssb.tokens.create(10, 'Shells', function (err, msg) {
      t.false(err)
      var tokenType2 = 'z' + msg.value.content.tokenType.slice(1)

      var giveMsgValue = {
        author: msg.value.author,
        content: {
          type: "tokens/" + meta['api-version'] + "/give",
          sources: [ { id: msg.key, amount: 1 } ],
          receiver: msg.value.author,
          amount: 1,
          description: null,
          tokenType: tokenType2
        }
    }

      ssb.tokens.validate.requirements(giveMsgValue, function (err, msg) {
        t.true(err)
        t.end()
      })
    })
  })

  tape('requirements(giveOp): inconsistent receiver', function (t) {
    ssb.tokens.create(10, 'Shells', function (err, msg) {
      t.false(err)

      ssb.identities.create(function (err, rec) {
        t.false(err)

        ssb.tokens.give({ amount: 1, id: msg.key }, rec, function (err, msg) {
          t.false(err)

          var giveMsgValue = {
            author: msg.value.author,
            content: {
              type: "tokens/" + meta['api-version'] + "/give",
              sources: [ { id: msg.key, amount: 1 } ],
              receiver: msg.value.author,
              amount: 1,
              description: null,
              tokenType: msg.value.content.tokenType
            }
          }

          ssb.tokens.validate.requirements(giveMsgValue, function (err, msg) {
            t.true(err)
            t.end()
          })
        })
      })
    })
  })

  tape('requirements(giveOp): inconsistent creator', function (t) {
    ssb.tokens.create(10, 'Shells', function (err, msg) {
      t.false(err)

      ssb.identities.create(function (err, author) {
        t.false(err)

        var giveMsgValue = {
          author: author,
          content: {
            type: "tokens/" + meta['api-version'] + "/give",
            sources: [ { id: msg.key, amount: 1 } ],
            receiver: msg.value.author,
            amount: 1,
            description: null,
            tokenType: msg.value.content.tokenType
          }
        }

        ssb.tokens.validate.requirements(giveMsgValue, function (err, msg) {
          t.true(err)
          t.end()
        })
      })
    })
  })
  
  tape('requirements(giveOp): insufficient unspent from source', function (t) {
    ssb.tokens.create(1, 'Shells', function (err, msg) {
      t.false(err)

      var giveMsgValue = {
        author: msg.value.author,
        content: {
          type: "tokens/" + meta['api-version'] + "/give",
          sources: [ { id: msg.key, amount: 2 } ],
          receiver: msg.value.author,
          amount: 2,
          description: null,
          tokenType: msg.value.content.tokenType
        }
      }

      ssb.tokens.validate.requirements(giveMsgValue, function (err, msg) {
        t.true(err)
        t.end()
      })
    })
  })
  
  tape('requirements(giveOp): correct give with later double-spend', 
    function (t) {

    ssb.tokens.create(1, 'Shells', function (err, createMsg) {
      t.false(err)
      
      ssb.tokens.give(
        { amount: 1, id: createMsg.key },
        createMsg.value.author,
        function (err, giveMsg) {

        t.false(err)

        var giveOp2 = {
          type: "tokens/" + meta['api-version'] + "/give",
          sources: [ { id: createMsg.key, amount: 1 } ],
          receiver: createMsg.value.author,
          amount: 1,
          description: null,
          tokenType: createMsg.value.content.tokenType
        }

        ssb.publish(giveOp2, function (err, giveMsg2) {
          ssb.tokens.validate.requirements(giveMsg.value, function (err, msg) {
            t.false(err)
            t.end()
          })
        })
      })
    })
  })

  tape('requirements(giveOp): incorrect published double-spend', 
    function (t) {

    ssb.tokens.create(1, 'Shells', function (err, createMsg) {
      t.false(err)
      
      ssb.tokens.give(
        { amount: 1, id: createMsg.key },
        createMsg.value.author,
        function (err, giveMsg) {

        t.false(err)

        var giveOp2 = {
          type: "tokens/" + meta['api-version'] + "/give",
          sources: [ { id: createMsg.key, amount: 1 } ],
          receiver: createMsg.value.author,
          amount: 1,
          description: null,
          tokenType: createMsg.value.content.tokenType
        }

        ssb.publish(giveOp2, function (err, giveMsg2) {
          ssb.tokens.validate.requirements(giveMsg2.value, function (err, msg) {
            t.true(err)
            t.end()
          })
        })
      })
    })
  })

  tape('requirements(giveOp): source not found', function (t) {
    var missing = "%2Wy4PB+8Fn5qeaZng4Lj5nteE+kAe6D58UKVhgiJfD4=.sha256"
    ssb.whoami(function (err, author) {
      t.false(err)

      var giveMsgValue = {
        author: author.id,
        content: {
          type: "tokens/" + meta['api-version'] + "/give",
          sources: [ { id: missing, amount: 1 } ],
          receiver: author.id,
          amount: 1,
          description: null,
          tokenType: 'BLABLABLABLABLAA'
        }
      }

      ssb.tokens.validate.requirements(giveMsgValue, function (err, msg) {
        t.true(err)
        t.end()
      })
    })
  })

  tape('requirements(burnOp): correct', function (t) {
    ssb.tokens.create(10, 'Shells', function (err, msg) {
      t.false(err)

      var burnMsgValue = {
        author: msg.value.author,
        content: {
          type: "tokens/" + meta['api-version'] + "/burn",
          sources: [ { id: msg.key, amount: 10 } ],
          amount: 10,
          description: null,
          tokenType: msg.value.content.tokenType
        }
      }

      ssb.tokens.validate.requirements(burnMsgValue, function (err, msg) {
        t.false(err)
        t.end()
      })
    })
  })

  tape('requirements(burnOp): incorrect source operation', function (t) {
    ssb.publish({ 
      type: "custom",
    }, function (err, msg) {
      var burnMsgValue = {
        author: msg.value.author,
        content: {
          type: "tokens/" + meta['api-version'] + "/burn",
          sources: [ { id: msg.key, amount: 1 } ],
          amount: 1,
          description: null,
          tokenType: 'abcdef1234567890'
        }
      }

      ssb.tokens.validate.requirements(burnMsgValue, function (err, msg) {
        t.true(err)
        t.end()
      })
    })
  })

  tape('requirements(burnOp): incorrect source with the right type', function (t) {
    ssb.publish({ 
      type: "tokens/" + meta["api-version"] + "/create",
      amount: 10,
      name: "Create Coin",
      unit: "CRC",
      decimals: 0,
      description: null,
      tokenType: 'abcdef0123456789' // Invalid token type
    }, function (err, msg) {
      var burnMsgValue = {
        author: msg.value.author,
        content: {
          type: "tokens/" + meta['api-version'] + "/burn",
          sources: [ { id: msg.key, amount: 1 } ],
          amount: 1,
          description: null,
          tokenType: 'abcdef1234567890'
        }
      }

      ssb.tokens.validate.requirements(burnMsgValue, function (err, msg) {
        t.true(err)
        t.end()
      })
    })
  })

  tape('requirements(burnOp): inconsistent tokenType', function (t) {
    ssb.tokens.create(10, 'Shells', function (err, msg) {
      t.false(err)
      var tokenType2 = 'z' + msg.value.content.tokenType.slice(1)

      var burnMsgValue = {
        author: msg.value.author,
        content: {
          type: "tokens/" + meta['api-version'] + "/burn",
          sources: [ { id: msg.key, amount: 1 } ],
          amount: 1,
          description: null,
          tokenType: tokenType2
        }
    }

      ssb.tokens.validate.requirements(burnMsgValue, function (err, msg) {
        t.true(err)
        t.end()
      })
    })
  })

  tape('requirements(burnOp): inconsistent receiver', function (t) {
    ssb.tokens.create(10, 'Shells', function (err, msg) {
      t.false(err)

      ssb.identities.create(function (err, rec) {
        t.false(err)

        ssb.tokens.give({ amount: 1, id: msg.key }, rec, function (err, msg) {
          t.false(err)

          var burnMsgValue = {
            author: msg.value.author,
            content: {
              type: "tokens/" + meta['api-version'] + "/burn",
              sources: [ { id: msg.key, amount: 1 } ],
              amount: 1,
              description: null,
              tokenType: msg.value.content.tokenType
            }
          }

          ssb.tokens.validate.requirements(burnMsgValue, function (err, msg) {
            t.true(err)
            t.end()
          })
        })
      })
    })
  })

  tape('requirements(burnOp): inconsistent creator', function (t) {
    ssb.tokens.create(10, 'Shells', function (err, msg) {
      t.false(err)

      ssb.identities.create(function (err, author) {
        t.false(err)

        var burnMsgValue = {
          author: author,
          content: {
            type: "tokens/" + meta['api-version'] + "/burn",
            sources: [ { id: msg.key, amount: 1 } ],
            amount: 1,
            description: null,
            tokenType: msg.value.content.tokenType
          }
        }

        ssb.tokens.validate.requirements(burnMsgValue, function (err, msg) {
          t.true(err)
          t.end()
        })
      })
    })
  })
  
  tape('requirements(burnOp): insufficient unspent from source', function (t) {
    ssb.tokens.create(1, 'Shells', function (err, msg) {
      t.false(err)

      var burnMsgValue = {
        author: msg.value.author,
        content: {
          type: "tokens/" + meta['api-version'] + "/burn",
          sources: [ { id: msg.key, amount: 2 } ],
          amount: 2,
          description: null,
          tokenType: msg.value.content.tokenType
        }
      }

      ssb.tokens.validate.requirements(burnMsgValue, function (err, msg) {
        t.true(err)
        t.end()
      })
    })
  })
  
  tape('requirements(burnOp): correct burn with later double-spend', 
    function (t) {

    ssb.tokens.create(1, 'Shells', function (err, createMsg) {
      t.false(err)
      
      ssb.tokens.burn(
        { amount: 1, id: createMsg.key },
        function (err, burnMsg) {

        t.false(err)

        var giveOp2 = {
          type: "tokens/" + meta['api-version'] + "/give",
          sources: [ { id: createMsg.key, amount: 1 } ],
          receiver: createMsg.value.author,
          amount: 1,
          description: null,
          tokenType: createMsg.value.content.tokenType
        }

        ssb.publish(giveOp2, function (err, giveMsg2) {
          ssb.tokens.validate.requirements(burnMsg.value, function (err, msg) {
            t.false(err)
            t.end()
          })
        })
      })
    })
  })

  tape('requirements(burnOp): incorrect published double-spend', 
    function (t) {

    ssb.tokens.create(1, 'Shells', function (err, createMsg) {
      t.false(err)
      
      ssb.tokens.burn(
        { amount: 1, id: createMsg.key },
        function (err, burnMsg) {

        t.false(err)

        var giveOp2 = {
          type: "tokens/" + meta['api-version'] + "/give",
          sources: [ { id: createMsg.key, amount: 1 } ],
          receiver: createMsg.value.author,
          amount: 1,
          description: null,
          tokenType: createMsg.value.content.tokenType
        }

        ssb.publish(giveOp2, function (err, giveMsg2) {
          ssb.tokens.validate.requirements(giveMsg2.value, function (err, msg) {
            t.true(err)
            t.end()
          })
        })
      })
    })
  })

  tape('requirements(burnOp): source not found', function (t) {
    var missing = "%2Wy4PB+8Fn5qeaZng4Lj5nteE+kAe6D58UKVhgiJfD4=.sha256"
    ssb.whoami(function (err, author) {
      t.false(err)

      var burnMsgValue = {
        author: author.id,
        content: {
          type: "tokens/" + meta['api-version'] + "/burn",
          sources: [ { id: missing, amount: 1 } ],
          amount: 1,
          description: null,
          tokenType: 'BLABLABLABLABLAA'
        }
      }

      ssb.tokens.validate.requirements(burnMsgValue, function (err, msg) {
        t.true(err)
        t.end()
      })
    })
  })
}
