# Roadmap

## 1. Create, Give, Burn, List, Trace, and Flag tokens

    [ ] Libraries
    [x] - Add missing syntactic validation to burn
    [x] - List test invariants before returning token
    [x] - Test full API for create, give, burn, list
    [ ] - Update Message schema to use "sources" instead of "source"
    [ ] - Update Message schema to use "tokenHash" instead of "token-hash"
    [ ] - Update TokenHash to also include the owner
    [ ] - Add transitive validation of dependencies to all operations
    [ ]   - Trigger with options.validate=true
    [ ] - Change op.owner to op.author for output of create,give,burn for consistency with list
    [ ]   - Update doc/api.md
    [ ] - Add separate 'unit' property from 'currency'
    [ ] - 2nd pass on implementation for clarity
    [ ] Command-Line Tool
    [ ]  - Ensure one-to-one mapping with API
    [ ] Identify and flag invalid messages
    [ ] Randomly Generated Tests

## 2. Example Applications

    [ ] Scuttleflotila Crowdfunding
    [ ] Small Shop Fidelity Program
    [ ] Community Supported Agriculture

## 3. Documentation

    [ ] Application Developer
        [ ] Example Scenarios
        [x] Programmer API
        [x] Clear and Concise Semantics of Operations for API
        [ ] Handling Errors
    [ ] Library Developer/Maintainer
        [ ] Message Schemas
        [ ] Valid and Invalid Sequences of Messages
        [ ] Permissions

## 4. Paper: Ensuring Trust in Economic Transactions in Single-Writer Append-Only Log Systems

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

## 6. Trade tokens

Pitch: Exchange some of your coins with those of someone else!

## 7. Shared Accounts

-> Requires Consensus Algorithms...
