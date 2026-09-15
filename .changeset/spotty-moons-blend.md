---
'@chainlink/data-engine-adapter': minor
---

Add blended endpoint to data-engine EA. Onboards the Data Engine `POST /api/v1/blended` endpoint, which routes between a market's session feeds (open/closed, or open/closed/overnight/extended) on a server-side market calendar. Supports `resultPath`/`decimals` for result extraction and scaling, and passes through provider 400/503 statuses.
