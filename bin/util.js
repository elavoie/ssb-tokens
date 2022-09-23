var pull = require('pull-stream')
var ref = require('ssb-ref')
var humane = require('./humane')

function cause (name, err) {
  err[name] = true
  return err
}

module.exports = function (ssb) {
  return {
    getLogId: function (author, cb) {
      if (!author || ref.isFeedId(author)) return cb(null, author)

      if (author[0] === "@")
        author = author.slice(1)

      pull(
        ssb.query.read({
          query: [ { $filter: {
            value: { content: { 
              type: 'about', 
              name: { $prefix: author }
            } }
          } }]
        }),
        pull.filter((msg) => {
          return ref.isFeedId(msg.value.content.about) &&
                (typeof msg.value.content.name === "string")
        }),
        pull.collect(function (err, ary) {
          if (err) return cb(err)

          if (ary.length === 0) 
            return cb(cause('notFound', 
                      new Error("Author name @" + author + " not found")))
          else if (ary.length > 1) 
            return cb(cause('ambiguous',
                      new Error("Ambiguous name @" + author + 
                                  ", found the following associated identities:\n" + 
                                  ary.join("\n"))))

          return cb(null, ary[0].value.content.about)
        })
      )
    }, 
    stringify: function (msgId, options, cb) {
      if (!ref.isMsgId(msgId)) {
        return cb(new Error("Invalid message id: " + msgId))
      }

      cb = cb || options

      if (typeof cb !== 'function') throw new Error('Invalid callback ' + cb)

      if (typeof options === 'function')
        options = {}

      if (options['ssb-message'] || options['ssb-message-value'])
        options.json = true

      ssb.get({ id: msgId, meta: true }, function (err, msg) {
        if (err) return cb(err) 

        var output = ""
        var format = null
        if (options.json) {
          format = function (ssb, msg, options, cb) {
            if (options['ssb-message'])
              output = msg
            else if (options['ssb-message-value'])
              output = msg.value
            else 
              output = msg.value.content

            output = JSON.stringify(output, null, 2)
            return cb(null, output)
          }
        } else {
          format = humane
        }

        format(ssb, msg, options, function (err, output) {
          if (typeof options.validate === 'undefined' || options.validate) {
            if (typeof options.cache === 'undefined' || options.cache) {
              ssb.tokens.valid(msg, function (err, msg) {
                if (err) return cb(err)
                return cb(null, output)
              })
            } else {
              ssb.tokens.validate.requirements(msg.value, function (err, msgValue) {
                if (err) return cb(err)
                return cb(null, output)
              })
            }
          } else {
            return cb(null, output)
          }
        })
      })
    }
  }
}
