var tape = require('tape')

module.exports = function run (ssb) {
  tape("help on tokens's api", function (t) {
    t.ok(ssb.tokens.help())
    t.end()
  })
}
