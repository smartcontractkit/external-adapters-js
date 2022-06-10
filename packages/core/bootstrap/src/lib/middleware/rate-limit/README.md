## Rate Limit middleware

Prevents Adapters from hitting a data provider too often over long periods of time by adjusting the TTL of cached DP responses based on the observed throughput for a feed.

Manages **hourly** and **monthly** API limits.
