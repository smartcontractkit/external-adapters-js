---
'@chainlink/data-engine-adapter': minor
---

Add the blended endpoint. Onboards the Data Engine `POST /api/v1/blended` endpoint, which routes between a market's session feeds (open/closed, or open/closed/overnight/extended) on a server-side market calendar. Supports `resultPath` (defaults to `indicatorPrice`) and `decimals` for result extraction and scaling. Also raises the default rate limit tier to 200 req/s.
