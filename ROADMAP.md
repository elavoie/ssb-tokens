# Roadmap

## 1. Create, Give, Burn tokens

    [x] Libraries
    [x] - Add missing syntactic validation to burn
    [x] - List test invariants before returning token
    [x] - Update Message schema to use "sources" instead of "source"
    [x] - Update Message schema to use "tokenType" instead of "token-hash"
    [x] - Update TokenHash to also include the owner
    [x] - Add transitive validation of dependencies to all operations
    [x] - Change op.owner to op.author for output of create,give,burn for consistency with list
    [x]   - Update doc/api.md
    [x] - Change recipient for receiver
    [x] - Add separate 'unit' property from 'currency'
    [x] - 2nd pass on implementation for clarity
    [x]   - max 80 chars wide
    [x] - Reformat API to be easily readable without rendering with only 80 characters width
    [x] - Add error handling behaviour when sources are missing (ssb-ooo will transparently get missing messages, and if it fails requirement checks will fail) 
    [x] - Add tests for all error conditions of format and requirements
    [x] - Add tests for valid, unspent, balance, create, give, burn, and applications
    [x] - Add description field to give and burn
    [x] - Security validation: when passing a message with both key and value, check that the key is indeed consistent with the value

    [ ] Command-Line Tool
       [x] Create
       [x] Give 
           [x] Add human readable 'show' output
       [x] Burn
           [x] Add human readable 'show' output
       [x] Operations (list operations)
           [x] Fix bug when participant and type does not filter properly
           [x] Add automatic connection to running ssb-server in all commands
           [x] Add automatic connection between two ssb-server
           [x] Add proper closing when CTRL-C a long running operation 
           [x] Split API functions that can be either source or async in two different names
               [x] Picked only one version for each, defaulting to 'cb' (async)
                   if there is no use case for live enumeration, and pull-stream source
                   otherwise.
           [x] Factored out the implementation of 'show' into a 'stringify' method and 
               added it in 'bin/util.js' for easier reuse.
           [x] Add unit tests
           [x] Commit latest versions to test with others
       [x] Ancestors (operation)
       [x] Unspent (operation)
       [x] Balance (token type, identity)
           [x] Simplify after having moved some operations to unspent
       [x] Validate (operation)
       [x] Unfollow (identities operation)
       [x] Streamline initial bootstrap and interop
           [x] Add 'init' command that initializes '~/.ssb-tokens' when missing
           [x] Require 'init' prior to running all other commands
           [x] Use a different local ssb-db for alpha release ('~/.ssb-tokens')
       [x] Add automatic matching of token-types from token name for 'give'
    [ ] Paper
       [x] Update API to create operations without automatic publishing
           on the database
       [x] Refactor to use decimal.js for arbitrary-precision operations 
           (ERC20 tokens expect 256-bits uint for amounts while JavaScript uses doubles (max 52-bits uint)
           [x] Use a single global Decimal constructor with precision limited to 78 digits (just enough
               to represent all uint256 numbers supported by ERC20)
           [x] Redefine valueOf to throw exception to prevent accidental usage of primitive operations
           [x] Modify type for `amount` to use string instead of Number, with maximum 79 characters
           [x] Modify serialization of create, give, and burn operations to use a string 
           [x] Fix unit tests
           [x] Modify create, give, and burn to accept Decimal amounts as inputs
           [x] Modify API input validation for amounts to support strings and tests for 
               loss of precision when using numbers
           [x] Modify queries to return amounts as Decimal object instead of Number
           [x] Remove support for decimals and represent amounts with 79 characters max (78 digits + '.')
           [x] Modify doc/api.md and help/* to reflect new semantics for decimals
       [x] Implement simulator of ERC20 transactions (see experiments roadmap)
       [ ] Measure performance
       [ ] Optimize to run in reasonable time on Raspberry Pi 4
       [ ] Update SSB-Tokens paper and submit to Middleware 2023
    [ ] Update Documentation
        [ ] README
            [ ] Update with complete instruction for installation and bootstrap
            [ ] Clean-up unused commands
            [ ] Manually check all README example applications
            [ ] Add link to API documentation
            [ ] Write guide on how to implement equivalents to ERC20 smart-contracts on ssb-tokens
        [ ] API
            [ ] Second pass for clean up and consistency 

# 3. Improvements towards 1.0
    [ ] Support for more use cases
        [ ] Personal library (keeping track of book lent with tokens)
        [ ] Tainting tokens from untrusted sources 

    [ ] More meaningful error messages when:
        [ ] An alias is used for which the private key is not in the local database.
        [ ] An operation cannot succeed because there is a missing source dependency
            in the database, preventing validation.

    [ ] Convenience
        [ ] API + CLI: Enable listing token types per receiver and per participant
            [ ] give: match tokens types only against those owned by identities for which
                      we have the private keys
        [ ] CLI: Enable listing the balances of all tokens held by a given participant
        [ ] CLI (balance --live): Add live updates of balances upon new received operations
        [ ] CLI: Enable listing of all unspent amounts for each token and associated operations

    [ ] Personalization
        [ ] CLI: Enable ssbClient to use a different default path than '~/.APPNAME'

    [ ] Replication
        [ ] Deploy a room server for synchronization 
        [ ] identities create: should also give full permissions to all created ids to enable replication

    [ ] Make token type easier to specify 
        [ ] Add aliasing of token types ("tokenType:XXX", "tt:XXX")
        [ ] Refactor naming scheme to distinguish token type, 
            alias, name, from message ids easily
        [ ] Update the following commands
            [ ] Give
            [ ] Burn
            [ ] Balance
            [ ] Types 
                [ ] Add alias command
                [ ] Mv current command under 'types list' 

    [ ] Add '--jsonlines' option to commands that output json

    [ ] Flag/Unflag operations

    [ ] Add automatic checks for updates to command-line interface,
        using an SSB Log for notification

    [ ] Add persistence of valid and invalid sets

    [ ] Link ssb-tokens identities to social identities and replicate transactions from friends

## 4. Improvements towards 2.0
 
    [ ] Replicate identities based on history of transactions, i.e. replicate identities that
        transacted with ours

## 2. Example Applications (CLI versions)

    [ ] Scuttleflotila Crowdfunding
    [ ] Small Shop Fidelity Program
    [ ] Community Supported Agriculture


## 3. Fuzzer: Randomly Generated Tests

    [ ] State-Machine Description
    [ ] Deterministic Executer

## 4. Documentation

    [ ] Application Developer
        [x] Example Scenarios
        [x] Programmer API
        [x] Clear and Concise Semantics of Operations for API
        [x] Handling Errors
    [ ] Library Developer/Maintainer
        [ ] Message Schemas
        [x] Valid and Invalid Sequences of Messages (see tests)

## 5. Future Real-World Deployment Considerations

    [ ] Losing Access to Tokens as an Issuer and User
    [ ] Invalidating Tokens in Circulation
    [ ] On-boarding New Users 
    [ ] Minimizing Hardware Requirements
    [ ] Creating Paper Trails for Accounting
    [ ] Handling Connectivity, Synchronization, and Indexing Issues 
    [ ] Paper+Printer+Point-of-Sale Design?
    [ ] Smartcard deployment?
