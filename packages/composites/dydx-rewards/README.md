# Chainlink dYdX Rewards Composite Adapter

The goal of this system is to calculate and publish, via a decentralized network of oracle signers, the DYDX token
rewards earned by traders using the dYdX layer 2 exchange. Rewards are stored in a Merkle tree, which contains the
cumulative rewards earned by each user since the start of the distribution program. Each epoch, the Merkle root is
updated on the `MerkleDistributorV1` smart contract to reflect rewards earned in the last epoch.

## Configuration

The adapter takes the following environment variables:

| Required? |           Name           |                      Description                      | Options | Defaults to |
| :-------: | :----------------------: | :---------------------------------------------------: | :-----: | :---------: |
|    ✅     |      `PRIVATE_KEY`       | Private key of account used to make special callbacks |         |             |
|    ✅     |        `RPC_URL`         |                  RPC URL of ETH node                  |         |             |
|    ✅     | `REWARDS_ORACLE_ADDRESS` |        Address of the `RewardsOracle` contract        |         |             |

## Running

See the [Composite Adapter README](../README.md) for more information on how to get started.

### Input Parameters

| Required? |  Name  |    Description     |       Options        | Defaults to |
| :-------: | :----: | :----------------: | :------------------: | :---------: |
|           | method | The method to call | [poke](#Poke-Method) |    poke     |

---

## Poke Method

### Input Params

| Required? |           Name           |                                Description                                | Options | Defaults to |
| :-------: | :----------------------: | :-----------------------------------------------------------------------: | :-----: | :---------: |
|    ✅     |   traderRewardsAmount    |       Maximum rewards distributed each epoch as trading incentives        |         |             |
|    ✅     | marketMakerRewardsAmount |     Maximum rewards distributed each epoch as market maker incentives     |         |             |
|    ✅     |         ipnsName         | The fixed IPNS name to which all oracle rewards data is published by dYdX |         |             |
|    ✅     |     traderScoreAlpha     |         Is a parameter used in the calculation of trader rewards          |         |             |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "traderRewardsAmount": 1000,
    "marketMakerRewardsAmount": 1000,
    "traderScoreAlpha": 1,
    "ipnsName": "sample"
  }
}
```

### Sample Output

```json
{
  "jobRunID": "1",
  "result": 1,
  "statusCode": 200,
  "data": {
    "result": 1
  }
}
```
