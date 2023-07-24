# @chainlink/stader-balance-adapter

## 1.4.1

### Patch Changes

- eff4c4cf5: Bumped framework version
- 14a549217: Bumped framework version
- 6840a38d2: Await retrieval of genesis timestamp during initialization. Bumped framework version.

## 1.4.0

### Minor Changes

- a574dbc4a: Added way to configure adapter to skip validator batching. Set BATCH_SIZE to 0.

### Patch Changes

- 244e02abf: Refactored file structure

## 1.3.2

### Patch Changes

- f2d2ae675: Replace internal util functions with ea-framework util functions
- 862ed8d89: Removed unused dependencies

## 1.3.1

### Patch Changes

- cc0d39064: Bumped framework version
- fb1b11b77: Bumped framework version

## 1.3.0

### Minor Changes

- d25ef6507: Pinned block number to Stader reported block. Updated withdrawn validator balance calculations. Added total supply endpoint. Added validation to ensure beacon slot number is finalized.

### Patch Changes

- f5dc53032: Updated logic to determine deposited validator

## 1.2.0

### Minor Changes

- 110fc8d21: Updated to use slot number when querying beacon chain

## 1.1.2

### Patch Changes

- 850a33d55: Adding filtering for enum values when creating input parameters
- 7710eb012: Updated social pool balance calculation logic

## 1.1.1

### Patch Changes

- 3230358e2: Fixed misconfigured ABI for penalty contract
- 611d9b17a: Removed balance check to determine withdrawn validator

## 1.1.0

### Minor Changes

- 80b8c7d95: Updated with new contracts and logic

## 1.0.3

### Patch Changes

- 48ceec85e: Updated balance calculations to include deposited ETH value
- bfa201d6d: Bumped framework version
- bfa201d6d: Bumped framework version
- c600ca386: Upgrade typescript version to 5.0.4
- bfa201d6d: Bumped framework version

## 1.0.2

### Patch Changes

- 9bcb13c90: Bumped framework version

## 1.0.1

### Patch Changes

- 31af84e69: Bumped framework version

## 1.0.0

### Major Changes

- 50366ec6b: Initial version of adapter
