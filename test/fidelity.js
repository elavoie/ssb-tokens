var tape = require('tape')


module.exports = function (ssb) {
  tape('Fidelity Card', function (t) {
    ssb.identities.create(function (err, customer) {
    t.error(err)

    ssb.identities.create(function (err, shop) {
    t.error(err)

    ssb.tokens.create(
    50,
    { name: "EUR", author: customer }, function (err, createEURMsg) {
    t.error(err)

    var count = 10
    var ptMsgs = []

    function exchange (cb) {
      ssb.tokens.give(
      { amount: 5, tokenType: createEURMsg.value.content.tokenType },
      shop,
      { author: customer }, function (err, giveEURMsg)  {
      t.error(err)

      ssb.tokens.create(
      1,
      { name: "Shop Point", author: shop }, function (err, createPtMsg) {
      t.error(err)

      ssb.tokens.give(
      { amount: 1, id: createPtMsg.key },
      customer,
      { author: shop }, function (err, givePtMsg) {
      t.error(err)

      count--
      ptMsgs.push(givePtMsg)

      if (count === 0) return cb(err, ptMsgs)
      else return exchange(cb)
      }) }) })
    }

    // Do all exchanges
    exchange(function (err, ptMsgs) {
    t.error(err)

    var shopPoint = ptMsgs[0].value.content.tokenType

    ssb.tokens.give(
    { amount: 10, tokenType: shopPoint },
    shop,
    { author: customer }, function (err, redeemMsg) {
    t.error(err)

    ssb.tokens.burn(
    redeemMsg.key,
    { author: shop }, function (err, burnMsg) {
    t.error(err)

    ssb.tokens.balance(shopPoint, customer, function (err, bal) {
    t.error(err)

    t.equal(bal.tokenType, shopPoint)
    t.equal(bal.amount.toNumber(), 0)
    t.equal(bal.created.length, 0)
    t.equal(bal.received.length, 10)
    t.equal(bal.received.map((id) => { 
      return Number(bal.all[id].value.content.amount)
    }).reduce((a,b) => a+b, 0), 10)
    t.equal(bal.given.length, 1)
    t.equal(bal.burnt.length, 0)

    ssb.tokens.balance(shopPoint, shop, function (err, bal) {
    t.error(err)

    t.equal(bal.tokenType, shopPoint)
    t.equal(bal.amount.toNumber(), 0)
    t.equal(bal.created.length, 10)
    t.equal(bal.created.map((id) => {
      return Number(bal.all[id].value.content.amount)
    }).reduce((a,b) => a+b, 0), 10)
    t.equal(bal.received.length, 1)
    t.equal(bal.all[bal.received[0]].value.content.amount, "10")
    t.equal(bal.given.length, 10)
    t.equal(bal.given.map((id) => {
      return Number(bal.all[id].value.content.amount)
    }).reduce((a,b) => a+b, 0), 10)
    t.equal(bal.burnt.length, 1)
    t.equal(bal.all[bal.burnt[0]].value.content.amount, "10")

    t.end()
    }) }) }) }) }) }) }) })
  })
}
