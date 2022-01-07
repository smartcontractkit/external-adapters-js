---
'@chainlink/agoric-adapter': major
---

Agoric \$LINK is now 18 decimal places and serialised as a string.

This was done to make fees precise and require no scaling, since they are now represented on the Agoric chain as JavaScript BigInts.

Please update to the latest: https://github.com/Agoric/dapp-oracle
