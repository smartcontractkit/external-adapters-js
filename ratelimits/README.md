# Chainlink Data Provider Ratelimit Reference Package

Package to update data provider rate limits and plans and to use as reference
to prevent getting limited by or spamming providers.

## adding a new provider

Each provider is defined within limits.json as so

```json
"1forge":[
    {
      "rateLimit1h":208.33,
      "tierName":"starter"
    },
    {
      "rateLimit1h":4166.66,
      "tierName":"premium"
    },
    {
      "rateLimit1h":41666.66,
      "tierName":"business"
    },
    {
      "rateLimit1h":416666.66,
      "tierName":"business+"
    }
  ], ...
```
- Each Object in the provider's array corresponds to a "tier" offered, in ascending order by price.
- Valid rateLimit definitions are `rateLimit1s`, `rateLimit1m`, and `rateLimit1h`, corresponding to the closest time-based
limit providers declare, 1 second, 1 minute, and 1 hour, respectively, currently using 10,000 /s to reflect unlimited. 
- Where declared, `tierName` should reflect the
provider's own terminology.

For Example, if Emmick's Empricial Evidence Emporium offers the following plans:
```json
{
"smol data ting": 
    {"monthly request limit": 720, "API calls/s": 1},
"big data dude": 
    {"30 minute request limit": 100, "API calls per 5 minutes": 50},
"CHONKY BYTES BOI": 
    {"daily limit":  "240", "API calls per second": "try and crash us!"}
}
```
Its entry would look like:
```json
"emmicksempiricalevidenceemporium":[
    {
      "ratelimit1s": 1,
      "rateLimit1h": 1,
      "tierName":"smaldatating"
    },
    {
      "rateLimit1m": 10
      "rateLimit1h": 200,
      "tierName":"bigdatadude"
    },
    {
      "rateLimit1s": 10000
      "rateLimit1h":10,
      "tierName":"chonkybytesboi"
    },
  ],
```

