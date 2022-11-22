var tape = require('tape')

module.exports = function run (ssb) {
  tape('Community Supported Agriculture', function (t) {
    ssb.identities.create(function (err, farmer) {
    t.error(err)

    ssb.identities.create(function (err, buyer1) {
    t.error(err)

    ssb.identities.create(function (err, buyer2) {
    t.error(err)

    ssb.tokens.create(
    1500,
    { name: "Farmer Basket Credit", author: farmer }, function (err, createMsg) {
    t.error(err)

    var farmerCredit = createMsg.value.content.tokenType
      
    ssb.tokens.give(
    { amount: 10, tokenType: farmerCredit },
    buyer1,
    { author: farmer }, function (err, giveMsg) {
    t.error(err)

    ssb.tokens.give(
    { amount: 10, tokenType: farmerCredit },
    buyer2,
    { author: farmer }, function (err, giveMsg2) {
    t.error(err)

    ssb.tokens.give(
    { amount: 1, tokenType: farmerCredit },
    buyer2,
    { author: buyer1 }, function (err, giveMsg3) {
    t.error(err)

    ssb.tokens.give(
    { amount: 2, tokenType: farmerCredit },
    farmer,
    { author: buyer2 }, function (err, giveMsg4) {
    t.error(err)

    ssb.tokens.burn(
    giveMsg4.key,
    { author: farmer }, function (err, burnMsg) {
    t.error(err)

    ssb.tokens.balance(farmerCredit, farmer, function (err, bal) {
    t.error(err)

    t.equal(bal.tokenType, farmerCredit)
    t.equal(bal.amount.toNumber(), 1480)
    t.equal(bal.created.length, 1)
    t.equal(bal.created[0], createMsg.key)
    t.equal(bal.given.length, 2)
    t.true(bal.given.indexOf(giveMsg.key) > -1)
    t.true(bal.given.indexOf(giveMsg2.key) > -1)
    t.equal(bal.received.length, 1)
    t.true(bal.received[0], giveMsg4.key)
    t.equal(bal.burnt.length, 1)
    t.true(bal.burnt[0], burnMsg.key)

    ssb.tokens.balance(farmerCredit, buyer1, function (err, bal) {
    t.error(err)

    t.equal(bal.tokenType, farmerCredit)
    t.equal(bal.amount.toNumber(), 9)
    t.equal(bal.created.length, 0)
    t.equal(bal.given.length, 1)
    t.equal(bal.given[0], giveMsg3.key)
    t.equal(bal.received.length, 1)
    t.equal(bal.received[0], giveMsg.key)
    t.equal(bal.burnt.length, 0)

    ssb.tokens.balance(farmerCredit, buyer2, function (err, bal) {
    t.error(err)

    t.equal(bal.tokenType, farmerCredit)
    t.equal(bal.amount.toNumber(), 9)
    t.equal(bal.created.length, 0)
    t.equal(bal.given.length, 1)
    t.equal(bal.given[0], giveMsg4.key)
    t.equal(bal.received.length, 2)
    t.true(bal.received.indexOf(giveMsg2.key) > -1)
    t.true(bal.received.indexOf(giveMsg3.key) > -1)
    t.equal(bal.burnt.length, 0)

    t.end()
    }) }) }) }) }) }) }) }) }) }) }) })
  })
}
