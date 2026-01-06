# @chainlink/dlc-cbtc-canton-por-adapter

## 1.0.0

### Major Changes

- Initial version of the DLC CBTC Canton Proof of Reserves adapter
- Supports two endpoints for CBTC supply verification:
  - `daSupply` - Queries Digital Asset API for token metadata
  - `attesterSupply` - Queries DLC.Link Attester API for Bitcoin reserves
- Uses BigInt arithmetic to handle values exceeding JavaScript's safe integer limit
- Returns string results to preserve precision for 10-decimal CBTC values
