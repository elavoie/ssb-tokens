# Roadmap

## 1. Create, Give, Burn, List, Trace, and Flag tokens

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
       [ ] Operations (list operations)
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
           [ ] Commit latest versions to test with others
       [ ] Ancestors / Trace (operation)
       [ ] Unspent (operation)
       [ ] Balance (token type, identity)
       [ ] Validate (operation)
       [ ] Block (identities operation)
       [ ] Streamline initial bootstrap and interop
           [ ] Add 'init' command that initializes '~/.ssb-tokens' when missing
           [ ] Require 'init' prior to running all other commands
           [ ] identities create: should also give full permissions to all created ids to enable replication
           [x] Use a different local ssb-db for alpha release ('~/.ssb-tokens')

# 3. Improvements towards 1.0
    [ ] More meaningful error messages when:
        [ ] An alias is used for which the private key is not in the local database.
        [ ] An operation cannot succeed because there is a missing source dependency
            in the database, preventing validation.

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

    [ ] Deploy a room server for synchronization 

    [ ] Add persistence of valid and invalid sets


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

## 4. Paper: Ensuring Trust in Economic Transactions in Single-Writer Append-Only Log Systems
    [ ] Add performance tests using traces from Ethereum ERC20 transactions
    [ ] Implement validation frontier optimization to lower memory usage

    [ ] Study Similarity between SSB and Holochain
    [ ] Fully understand "The consensus number of a cryptocurrency"
    [ ] Identify Primitives Required for a Mutual Credit System (ideally similar to SSB-Tokens)
    [ ] Formal Model of the Problem
    [ ] Proof-of-Insolvency
    [ ] Proof-of-Fork
    [ ] Proof-of-Witness
    [ ] Theorems
    [ ] Empirical Evaluation of Actual Community Transactions

## 5. Real-World Deployment Considerations

    [ ] Losing Access to Tokens as an Issuer and User
    [ ] Invalidating Tokens in Circulation
    [ ] On-boarding New Users 
    [ ] Minimizing Hardware Requirements
    [ ] Creating Paper Trails for Accounting
    [ ] Handling Connectivity, Synchronization, and Indexing Issues 
    [ ] Paper+Printer+Point-of-Sale Design?
