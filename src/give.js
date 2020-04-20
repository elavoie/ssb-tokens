module.exports = function give () {

  // Publish
  //
  // Pre-condition (Since Previous Check): 
  //      - No previous "Give" operation that spent more than what remains 
  //        after this "Give"
  //      - More General, Faster: No "Give" operation with the same source
  //      - More General, Faster: No "Give" operation
  //      - More General, Slower: No other operation on the same feed
  //
  // TODO: Should include a verification that the log has not been extended
  //       since the last state check. Otherwise, it is possible that another
  //       application has spent the funds between the moment we verified
  //       the available funds and the time at which we are publishing the
  //       transaction.
}
