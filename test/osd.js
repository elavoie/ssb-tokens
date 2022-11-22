var tape = require('tape')

module.exports = function (ssb) {
  tape('Sweat-Equity Open Source Development', function (t) {
    ssb.identities.create(function (err, volunteer) {
    t.error(err)

    ssb.identities.create(function (err, maintainer) {
    t.error(err)

    ssb.identities.create(function (err, backer) {
    t.error(err)

    ssb.tokens.create(
    2,
    { name: "SSB-Tokens Hour", unit: "Hour", author: maintainer },
    function (err, createMsg) {
    t.error(err)

    var ssbTokensHour = createMsg.value.content.tokenType

    ssb.tokens.give(
    { amount: 2, tokenType: ssbTokensHour },
    volunteer, 
    { author: maintainer }, function (err, giveMsg) {
    t.error(err)

    ssb.tokens.create(
    20, 
    { name: "USD", author: backer }, function (err, createUsdMsg) {
    t.error(err)

    var usd = createUsdMsg.value.content.tokenType

    ssb.tokens.give(
    { amount: 20, tokenType: usd },
    maintainer,
    { author: backer }, function (err, donationMsg) {
    t.error(err)

    ssb.tokens.give(
    { amount: 1, tokenType: ssbTokensHour },
    maintainer, 
    { author: volunteer }, function (err, redeemHourMsg) {
    t.error(err)

    ssb.tokens.give(
    { amount: 10, tokenType: usd },
    volunteer,
    { author: maintainer }, function (err, getUsdMsg)  {
    t.error(err)

    ssb.tokens.burn(
    redeemHourMsg.key,
    { author: maintainer }, function (err, burnMsg) {
    t.error(err)

    ssb.tokens.balance(ssbTokensHour, volunteer, function (err, bal) {
    t.error(err)

    t.equal(bal.tokenType, ssbTokensHour)
    t.equal(bal.amount.toNumber(), 1)
    t.equal(bal.received.length, 1)
    t.equal(bal.all[bal.received[0]].value.content.amount, "2")
    t.equal(bal.given.length, 1)
    t.equal(bal.all[bal.given[0]].value.content.amount, "1")

    ssb.tokens.balance(usd, volunteer, function (err, bal)  {
    t.equal(bal.tokenType, usd)
    t.equal(bal.amount.toNumber(), 10)
    t.equal(bal.received.length, 1)
    t.equal(bal.all[bal.received[0]].value.content.amount, "10")

    t.end()
    }) }) }) }) }) }) }) }) }) }) }) })
  })
}
