// Pre-conditions: An ssb-server must be running. 
// Post-conditions: The user feed is extended by one message describing the new
//   tokens.
module.exports = function create (amount, currency, options) {
  // Assign default values
  if (!options) {
    options = {}
  }
  options.ssb = false
  options.id = false
  options.description = options.hasOwnProperty('description') ? options.description : null
  options.transferable = options.hasOwnProperty('transferable') ? options.transferable : true 
  options.burnable = options.hasOwnProperty('burnable') ? options.burnable : true
  options.unit = options.hasOwnProperty('unit') ? options.unit : 0.01

  // Validate arguments
  
  // Format message
  
  // Publish message

  return true
}
