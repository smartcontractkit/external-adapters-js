# 0005. The Issuer Multiplier is applied in an EA

Status: proposed
Date: 2026-11-03
Risk acceptance: pending Product

## Context

The upstream 24/7 module produces a blended, smoothed price that the Asset DON publishes to
data-engine as a v11 stream. Before a tokenized equity price reaches the DF1 DON, something
has to multiply that 24/7 Price by the Issuer Multiplier, which each Issuer keeps on-chain.

## Decision

Apply the Issuer Multiplier in the tokenized-equity EA, as a composite step: fetch the 24/7
Price from the data-engine EA, read the Issuer Multiplier on-chain, multiply and scale. Each
DON node runs this independently, and consensus happens on the result. The endpoint shape is
in [0001](./0001-issuer-price-247-is-a-new-issuer-agnostic-endpoint.md).

## Considered Options

- **On-chain multiplication:** rejected; customers cannot be asked to deploy contracts on top
  of the market rate feed.
- **Calculated streams:** rejected; a 24/7 stream cannot be an input to a calculated stream
  without another loop in the data-engine call chain, a platform limitation.
- **A consumer contract combining the tokenized-equity and market price contracts:** rejected;
  contract audit time put the launch timeline at risk.
- **CRE workflow:** rejected; getting a workflow live and audited put the timeline at risk.
- **A new standalone EA:** rejected; it would duplicate the Issuer readers and RPC settings
  that tokenized-equity already has, and need a new deployment at every node operator.

See the
[decision record doc](https://docs.google.com/document/d/1YaPG1bBRCF6Wni4IT8jQSRAFyntpLOngSH8nA03NuF4/edit?tab=t.0)
"Other Options Explored" tab for the original analysis.

## Consequences

- Ships on existing infrastructure and node operator deployments, with no audit and no new
  platform.
- Reuses the Issuer readers in `src/issuers/` and the existing RPC settings, so the 24/5 and
  24/7 paths share one implementation per Issuer.
- 24/7 code ships in the same image as the live 24/5 feeds, so a release of either affects
  both. [0001](./0001-issuer-price-247-is-a-new-issuer-agnostic-endpoint.md) limits this by
  leaving the existing endpoints unchanged.

## Risks accepted

All owned by Product.

1. **Limited telemetry.** No metrics on RPC reads, Issuer Multiplier values or Asset Paused,
   only the framework's request metrics. Partial mitigation: every response carries its
   intermediate values (`rawPrice`, `multiplier.value`, `rawMultipliedPrice`, the
   data-engine report).
2. **Harder debugging.** No history of Issuer Multiplier values or of what each node read;
   investigations depend on node operators' logs.
3. **Configuration per node operator.** `asset`, `registry` and `network` live in job specs;
   the RPC settings for three chains and `DATA_ENGINE_ADAPTER_URL` are set by each node
   operator. Mismatched feed mapping
   ([0001](./0001-issuer-price-247-is-a-new-issuer-agnostic-endpoint.md)) is one case.
4. **Hidden dependencies.** At runtime, the data-engine EA and RPCs for Base, Ethereum and
   Robinhood chain: any one failing means a 5xx. At build time, the
   `@chainlink/data-engine-adapter` workspace package: a change there can change this EA's
   behavior without a tokenized-equity change.
5. **Nodes disagree on the Issuer Multiplier around an update.** Each node reads it from its
   own RPC at its own moment. Consensus absorbs a minority, but a split DON can produce a
   price between the old and new values, or miss a round.
6. **No RPC quorum.** Each node trusts one RPC per chain. A lagging or wrong RPC feeds a wrong
   multiplier into that node's answer, with no cross-check.
7. **Node operator rollout and configuration burden.** Every node operator must deploy the new
   version and configure RPCs for up to three chains. A node missing one fails closed, which
   shrinks the effective quorum for those feeds.
8. **RPC load grows with DON size.** Reads per cycle are payloads times nodes, two per payload
   for Robinhood.

RPC failures fail closed, and multiplier decimals are assumed to be 18: see
[0004](./0004-price-and-multiplier-are-read-independently.md).
