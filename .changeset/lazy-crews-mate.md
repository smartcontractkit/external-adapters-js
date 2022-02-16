---
'@chainlink/synthetix-debt-pool-adapter': major
---

Update Synthetix Debt Pool EA to reflect changes to SIP-165. This separates the EA to 2 endpoints. One is to calculate the Debt Ratio and the other is to calcualte the total debt issued. The chain names that are passed in the request body have also been updated to match those in the SynthetixIO JavaScript library.
