# API Design Rationale

## Independence from Execution Environment

While close to the [command-line interface](./help/index.txt), the API design
however sometimes departs from it or adds additional options to minimize the
dependence on particular execution environments (ex: id specified as
[ssb-keys](https://github.com/ssbc/ssb-keys) to avoid the need of looking into
the ````~/.ssb```` folder).

## Fast Message Lookup

All log messages, created as side-effects of API operations, have a type
````tokens/<version>/<operation>````, where ````<version>```` is the
protocol version, and ````<operation>```` is the operation performed, with a
one-to-one mapping with the API.  The version and operations are encoded in the
type to make lookup faster, i.e. by leveraging indexing made by databases on
message type.

## Random Alphanumeric Protocol Version

The current version of the protocol is defined with 4 random alphanumeric
characters, chosen at the time of designing the API. The version is random to
avoid conflicts with other potential messages that would use the same message
types (ex: ````tokens/<semver>/<operation>````), since the SSB community
does not enforce unicity of message types between applications (i.e. this would
require consensus).

## Play Nice with other SSB Applications

The library can work with a minimal number of operations offered by ssb-server,
so as to avoid unduly loading plugins that are not useful to other applications. Moreover, the connection to [ssb-server](https://github.com/ssbc/ssb-server) is done through [ssb-client](https://github.com/ssbc/ssb-client) for concurrent operations with other currently running applications, such as [Patchwork](https://github.com/ssbc/patchwork) or [Oasis](https://github.com/fraction/oasis).
