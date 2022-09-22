var tape = require('tape')
var util = require('../src/util')
var pull = require('pull-stream')
var Abortable = require('pull-abortable')
var Server = require('../src/server')
var os = require('os')
var path = require('path')
var fs = require('fs')

module.exports = function (ssb) {
  tape('operations: correct no options', function (t) {
    ssb.tokens.create(1, "Operation Token", function (err, msg) {
      t.error(err)

      pull(
        ssb.tokens.operations(),
        pull.collect(function (err, msgs) {
          t.error(err)
          t.ok(msgs.length > 0)
          t.end()
        })
      )
    })
  })

  tape('operations: correct with single author', function (t) {
    ssb.identities.create(function (err, author) {
      t.error(err)

      ssb.identities.create(function (err, nonAuthor) {
        t.error(err)

        ssb.tokens.create(1, { name: "Operation Token", author: author }, function (err, msg) {
          t.error(err)

          pull(
            ssb.tokens.operations({ match: { author: author } }),
            pull.collect(function (err, msgs) {
              t.error(err)
              t.equal(msgs.length, 1)
              t.equal(msgs[0].key, msg.key)

              pull(
                ssb.tokens.operations({ match: { author: nonAuthor } }),
                pull.collect(function (err, msgs) {
                  t.error(err)
                  t.equal(msgs.length, 0)
                  t.end()
                })
              )
            })
          )
        })
      })
    })
  })

  tape('operations: correct with two different authors', function (t) {
    ssb.identities.create(function (err, author1) {
      t.error(err)

      ssb.identities.create(function (err, author2) {
        t.error(err)

        ssb.identities.create(function (err, nonAuthor) {
          t.error(err)

          ssb.tokens.create(
            1, 
            { name: "Operation Token", author: author1 }, function (err, msg1) {
            t.error(err)

            ssb.tokens.create(
              1, 
              { name: "Operation Token", author: author2 }, function (err, msg2) {
              t.error(err)

              var keys = [ msg1.key, msg2.key ]

              pull(
                ssb.tokens.operations({ match: { author: [author1,author2] } }),
                pull.collect(function (err, msgs) {
                  t.error(err)
                  t.equal(msgs.length, 2)
                  t.ok(keys.indexOf(msgs[0].key) > -1)
                  t.ok(keys.indexOf(msgs[1].key) > -1)

                  pull(
                    ssb.tokens.operations({ match: { author: nonAuthor } }),
                    pull.collect(function (err, msgs) {
                      t.error(err)
                      t.equal(msgs.length, 0)
                      t.end()
                    })
                  )
                })
              )
            })
          })
        })
      })
    })
  })

  tape('operations: invalid author provided', function (t) {
    try {
      pull(
        ssb.tokens.operations({ match: { author: 'invalidauthor' } }),
        pull.collect(function (err, msgs) {
          t.true(err)
        })
      )
    } catch (err) {
      t.ok(err)
      t.end()
    }
  })

  tape('operations: correct receiver', function (t) {
    ssb.identities.create(function (err, receiver) {
      t.error(err)

      ssb.identities.create(function (err, nonReceiver) {
        t.error(err)

        ssb.tokens.create(1, "Token", function (err, msg) {
          t.error(err)

          ssb.tokens.give({ amount: 1, id: msg.key}, receiver, function (err, msg) {
            t.error(err)

            pull(
              ssb.tokens.operations({ match: { receiver: receiver } }),
              pull.collect(function (err, msgs) {
                t.error(err)

                t.equal(msgs.length, 1)
                t.equal(msgs[0].key, msg.key)

                pull(
                  ssb.tokens.operations({ match: { receiver: nonReceiver } }),
                  pull.collect(function (err, msgs) {
                    t.error(err)
                    t.equal(msgs.length, 0)
                    t.end()
                  })
                )
              })
            )
          })
        })
      })
    })
  })

  tape('operations: invalid receiver provided', function (t) {
    try {
      pull(
        ssb.tokens.operations({ match: { receiver: 'invalidreceiver' } }),
        pull.collect(function (err, msgs) {
          t.true(err)
        })
      )
    } catch (err) {
      t.ok(err)
      t.end()
    }
  })

  tape('operations: correct participant provided', function (t) {
    ssb.identities.create(function (err, participant) {
      t.error(err)

      ssb.identities.create(function (err, receiver) {
        t.error(err)

        ssb.identities.create(function (err, nonParticipant) {
          t.error(err)

          ssb.tokens.create(1, "Token", function (err, msg1) {
            t.error(err)

            ssb.tokens.give(
              { amount: 1, id: msg1.key },
              participant,
              function (err, msg2) {
              t.error(err)

              ssb.tokens.give(
                { amount: 1, id: msg2.key}, 
                receiver, 
                { author: participant }, function (err, msg3) {
                t.error(err)

                pull(
                  ssb.tokens.operations({ match: { participant: participant } }),
                  pull.collect(function (err, msgs) {
                    t.error(err)

                    var keys = [ msg2.key, msg3.key ]

                    t.equal(msgs.length, 2)
                    t.true(keys.indexOf(msgs[0].key) > -1)
                    t.true(keys.indexOf(msgs[1].key) > -1)

                    pull(
                      ssb.tokens.operations({ match: { participant: nonParticipant } }),
                      pull.collect(function (err, msgs) {
                        t.error(err)
                        t.equal(msgs.length, 0)
                        t.end()
                      })
                    )
                  })
                )
              })
            })
          })
        })
      })
    })
  })

  tape('operations: participant non-duplicate operations', function (t) {
    ssb.identities.create(function (err, participant) {
      t.error(err)

      ssb.tokens.create(1, { name: "Token", author: participant }, function (err, msg) {
        t.error(err)

        ssb.tokens.give(
          { amount: 1, id: msg.key }, 
          participant, 
          { author: participant }, function (err, msg2) {
          t.error(err)

          pull(
            ssb.tokens.operations({ match: { participant: participant } }),
            pull.collect(function (err, msgs) {
              t.error(err)

              var keys = [ msg.key, msg2.key ]
              t.equal(msgs.length, 2)
              t.ok(keys.indexOf(msg.key) > -1)
              t.ok(keys.indexOf(msg2.key) > -1)
              t.end()
            })
          )
        })
      })
    })
  })

  tape('operations: correct retrieve operations of all types', function (t) {
    ssb.identities.create(function (err, author) {
      t.error(err)

      ssb.tokens.create(1, { name: "Token", author: author }, function (err, msg) {
        t.error(err)

        ssb.tokens.give(
          { amount: 1, id: msg.key }, 
          author, 
          { author: author}, function (err, msg2) {
          t.error(err)

          ssb.tokens.burn(msg2.key, { author: author }, function (err, msg3) {
            t.error(err)

            var keys = [ msg.key, msg2.key, msg3.key ]

            pull(
              ssb.tokens.operations({ match: { author: author } }),
              pull.collect(function (err, msgs) {
                t.error(err)
                t.equal(msgs.length, 3)
                t.ok(keys.indexOf(msgs[0].key) > -1)
                t.ok(keys.indexOf(msgs[1].key)  > -1)
                t.ok(keys.indexOf(msgs[2].key)  > -1)
                t.end()
              })
            )
          })
        })
      })
    })
  })

  tape('operations: correct deactivation of retrival of certain types', function (t) {
    ssb.identities.create(function (err, author) {
      t.error(err)

      ssb.tokens.create(1, { name: "Token", author: author }, function (err, msg) {
        t.error(err)

        ssb.tokens.give(
          { amount: 1, id: msg.key }, 
          author, 
          { author: author}, function (err, msg2) {
          t.error(err)

          ssb.tokens.burn(msg2.key, { author: author }, function (err, msg3) {
            t.error(err)

            pull(
              ssb.tokens.operations({ 
                match: { 
                  author: author,
                  operations: {
                    create: true
                  }
                } 
              }),
              pull.collect(function (err, msgs) {
                t.error(err)
                t.equal(msgs.length, 1)
                t.ok(msgs[0].key === msg.key)

                var keys = [ msg2.key, msg3.key ]

                pull(
                  ssb.tokens.operations({
                    match: {
                      author: author,
                      operations: {
                        give: true,
                        burn: true
                      }
                    }
                  }),
                  pull.collect(function (err, msgs) {
                    t.error(err)
                    t.equal(msgs.length, 2)
                    t.ok(keys.indexOf(msgs[0].key) > -1)
                    t.ok(keys.indexOf(msgs[1].key) > -1)
                    t.ok(msgs[0].key !== msgs[1].key)
                    t.end()
                  })
                )
              })
            )
          })
        })
      })
    })
  })

  tape('operations: correct tokenType matching', function (t) {
    ssb.identities.create(function (err, author) {
      t.error(err)

      ssb.tokens.create(1, "Token2", function (err, msg) {
        t.error(err)

        ssb.tokens.create(1, { name: "Token", author: author }, function (err, msg2) {
          t.error(err)

          pull(
            ssb.tokens.operations({ match: { tokenType: msg2.value.content.tokenType } }),
            pull.collect(function (err, msgs) {
              t.error(err)
              t.equal(msgs.length, 1)
              t.equal(msgs[0].key, msg2.key)
              t.end()
            })
          )
        })
      })
    })
  })

  tape('operations: correct default valid operations matching', function (t) {
    ssb.identities.create(function (err, author) {
      t.error(err)

      ssb.tokens.create(1, { name: "Valid Token", author: author }, function (err, msg) {
        t.error(err)

        ssb.identities.publishAs({
          id: author,
          content: {
            type: util.createType,
            name: "Invalid Token",
            unit: '',
            decimals: -1,
            description: null
          },
          private: false
        }, function (err, msg2) {
          t.error(err)

          pull(
            ssb.tokens.operations({ match: { author: author } }),
            pull.collect(function (err, msgs) {
              t.error(err)
              t.equal(msgs.length, 1)
              t.equal(msgs[0].key, msg.key)
              t.end()
            })
          )
        })
      })
    })
  })

  tape('operations: correct explicit invalid operations matching', function (t) {
    ssb.identities.create(function (err, author) {
      t.error(err)

      ssb.tokens.create(1, { name: "Valid Token", author: author }, function (err, msg) {
        t.error(err)

        ssb.identities.publishAs({
          id: author,
          content: {
            type: util.createType,
            name: "Invalid Token",
            unit: '',
            decimals: -1,
            description: null
          },
          private: false
        }, function (err, msg2) {
          t.error(err)

          pull(
            ssb.tokens.operations({ match: { author: author }, valid: false, invalid: true }),
            pull.collect(function (err, msgs) {
              t.error(err)
              t.equal(msgs.length, 1)
              t.equal(msgs[0].key, msg2.key)
              t.end()
            })
          )
        })
      })
    })
  })

  tape('operations: correct explicit invalid and implicit valid operations matching', function (t) {
    ssb.identities.create(function (err, author) {
      t.error(err)

      ssb.tokens.create(1, { name: "Valid Token", author: author }, function (err, msg) {
        t.error(err)

        ssb.identities.publishAs({
          id: author,
          content: {
            type: util.createType,
            name: "Invalid Token",
            unit: '',
            decimals: -1,
            description: null
          },
          private: false
        }, function (err, msg2) {
          t.error(err)

          var keys = [ msg.key, msg2.key]

          pull(
            ssb.tokens.operations({ match: { author: author }, invalid: true }),
            pull.collect(function (err, msgs) {
              t.error(err)
              t.equal(msgs.length, 2)
              t.ok(keys.indexOf(msgs[0].key) > -1)
              t.ok(keys.indexOf(msgs[1].key) > -1)
              t.ok(msgs[0].key !== msgs[1].key)
              t.end()
            })
          )
        })
      })
    })
  })

  tape('operations: error when both valid and invalid are false', function (t) {
    try {
      pull(
        ssb.tokens.operations({ valid: false }),
        pull.collect(function (err, msgs) {
          t.fail(err)
        })
      )
    } catch (err) {
      t.ok(err)
      t.end()
    }
  })

  tape('operations: sync message', function (t) {
    ssb.identities.create(function (err, author) {
      t.error(err)

      ssb.tokens.create(1, { name: "Token", author: author }, function (err, msg) {
        t.error(err)

        ssb.tokens.give({ id: msg.key }, author, { author: author }, function (err, msg2) {
          t.error(err)

          var abort = Abortable()

          var keys = [ msg.key, msg2.key ]

          pull(
            ssb.tokens.operations({ match: { author: author }, sync: true, live: true }),
            pull.through((msg) => { 
              if (msg.sync) abort.abort(true)
            }), 
            abort,
            pull.collect(function (err, msgs) {
              t.error(err)
              t.equal(msgs.length, 2)
              t.ok(keys.indexOf(msgs[0].key) > -1)
              t.ok(keys.indexOf(msgs[1].key) > -1)
              t.ok(msgs[0].key !== msgs[1].key)
              t.end()
            })
          )
        })
      })
    })
  })

  tape('operations: live replication between servers', function (t) {

    var appname1 = 'ssb-tokens:test:operations:live1'
    var appname2 = 'ssb-tokens:test:operations:live2'
    var ssb1Dir = path.join(os.tmpdir(), appname1)
    var ssb2Dir = path.join(os.tmpdir(), appname2)

    fs.rmdirSync(ssb1Dir, { recursive: true })
    fs.rmdirSync(ssb2Dir, { recursive: true })

    // The default ssb-server used for tests (ssb), initialized
    // in test/index.js, already uses port 8008.
    // Use different ports for the following two instances to avoid conflicts
    var ssb1 = Server({ appname: appname1, path: ssb1Dir, port: 8009 })
    var ssb2 = Server({ appname: appname2, path: ssb2Dir, port: 8010 })

    ssb1.tokens.identities.follow(ssb2.id, function (err, msg) {
      t.error(err)

      ssb2.tokens.identities.follow(ssb1.id, function (err, msg) {
        t.error(err)

        var abortable1 = Abortable()
        var abortable2 = Abortable()
        var done1 = false
        var done2 = false
        var closed1 = false
        var closed2 = false 

        function done () {
          if (done1 && done2) {
            ssb1.close(function (err) { 
              t.error(err) 
              closed1 = true
              if (closed2) t.end()
            })
            ssb2.close(function (err) { 
              t.error(err) 
              closed2 = true
              if (closed1) t.end()
            })
          }
        }

        pull(
          ssb1.tokens.operations({ live: true }),
          abortable1,
          pull.drain(function (msg) {
            if (msg.value.author === ssb2.id &&
                msg.value.content.type === util.createType) {
              abortable1.abort(done1=true)
              done()
            }
          })
        )

        pull(
          ssb2.tokens.operations({ live: true }),
          abortable2,
          pull.drain(function (msg) {
            if (msg.value.author === ssb1.id &&
                msg.value.content.type === util.createType) {
              abortable2.abort(done2=true)
              done()
            }
          })
        )

        ssb1.tokens.create(1, "Tokens1", function (err, msg) {
          t.error(err)
        })

        ssb2.tokens.create(1, "Tokens2", function (err, msg) {
          t.error(err)
        })
      })
    })
  })
}
