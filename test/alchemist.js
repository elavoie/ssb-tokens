var tape = require('tape')
var util = require('util')

module.exports = function run (ssb) {
  tape('Scuttleflotilla Crowdfunding', function (t) {
    ssb.identities.create(function (err, initiator) {
    t.error(err)

    ssb.identities.create(function (err, backer) {
    t.error(err)

    ssb.identities.create(function (err, friend) {
    t.error(err)

    ssb.tokens.create(
    100, 
    { name: 'Alchemist Token', author: initiator }, function (err, createMsg) {
    t.error(err)

    var alchemistTok = createMsg.value.content.tokenType
    ssb.tokens.give(
    { amount: 1, tokenType: alchemistTok },
    backer,
    { author: initiator }, function (err, giveMsg) {
    t.error(err)

    ssb.tokens.balance(alchemistTok, initiator, function (err, bal) {
    t.error(err)

    t.equal(bal.tokenType, alchemistTok)
    t.equal(bal.amount, 99)
    t.equal(bal.created.length, 1)
    t.equal(bal.created[0], createMsg.key)
    t.equal(bal.given.length, 1)
    t.equal(bal.given[0], giveMsg.key)
    t.equal(bal.burnt.length, 0)
    t.equal(bal.received.length, 0)

    ssb.tokens.balance(alchemistTok, backer, function (err, bal) {
    t.error(err)

    t.equal(bal.tokenType, alchemistTok)
    t.equal(bal.amount, 1)
    t.equal(bal.created.length, 0)
    t.equal(bal.received.length, 1)
    t.equal(bal.received[0], giveMsg.key)
    t.equal(bal.given.length, 0)
    t.equal(bal.burnt.length, 0)

    ssb.tokens.give(
    { amount: 1, tokenType: alchemistTok }, 
    friend,
    { author: backer }, function (err, giveMsg2) {
    t.error(err)

    ssb.tokens.balance(alchemistTok, backer, function (err, bal) {
    t.error(err)

    t.equal(bal.tokenType, alchemistTok)
    t.equal(bal.amount, 0)
    t.equal(bal.created.length, 0)
    t.equal(bal.received.length, 1)
    t.equal(bal.received[0], giveMsg.key)
    t.equal(bal.given.length, 1)
    t.equal(bal.given[0], giveMsg2.key)
    t.equal(bal.burnt.length, 0)

    ssb.tokens.balance(alchemistTok, friend, function (err, bal) {
    t.error(err)

    t.equal(bal.tokenType, alchemistTok)
    t.equal(bal.amount, 1)
    t.equal(bal.created.length, 0)
    t.equal(bal.received.length, 1)
    t.equal(bal.received[0], giveMsg2.key)
    t.equal(bal.given.length, 0)
    t.equal(bal.burnt.length, 0)

    ssb.tokens.give(
    { amount: 1, tokenType: alchemistTok },
    initiator,
    { author: friend }, function (err, giveMsg3) {
    t.error(err)

    ssb.tokens.balance(alchemistTok, friend, function (err, bal) {
    t.error(err)

    t.equal(bal.tokenType, alchemistTok)
    t.equal(bal.amount, 0)
    t.equal(bal.created.length, 0)
    t.equal(bal.received.length, 1)
    t.equal(bal.received[0], giveMsg2.key)
    t.equal(bal.given.length, 1)
    t.equal(bal.given[0], giveMsg3.key)
    t.equal(bal.burnt.length, 0)
    
    ssb.tokens.balance(alchemistTok, initiator, function (err, bal) {
    t.error(err)

    t.equal(bal.tokenType, alchemistTok)
    t.equal(bal.amount, 100)
    t.equal(bal.created.length, 1)
    t.equal(bal.created[0], createMsg.key)
    t.equal(bal.received.length, 1)
    t.equal(bal.received[0], giveMsg3.key)
    t.equal(bal.given.length, 1)
    t.equal(bal.given[0], giveMsg.key)
    t.equal(bal.burnt.length, 0)

    ssb.tokens.burn(
    bal.received[0],
    { author: initiator }, 
    function (err, burnMsg) {
    t.error(err)

    ssb.tokens.balance(alchemistTok, initiator, function (err, bal) {
    t.error(err)

    t.equal(bal.tokenType, alchemistTok)
    t.equal(bal.amount, 99)
    t.equal(bal.created.length, 1)
    t.equal(bal.created[0], createMsg.key)
    t.equal(bal.received.length, 1)
    t.equal(bal.received[0], giveMsg3.key)
    t.equal(bal.given.length, 1)
    t.equal(bal.given[0], giveMsg.key)
    t.equal(bal.burnt.length, 1)
    t.equal(bal.burnt[0], burnMsg.key)

    t.end()
    }) }) }) }) }) }) }) }) }) }) }) }) }) }) })
  })
}
