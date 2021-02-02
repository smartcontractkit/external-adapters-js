# Bootstrap Chainlink external adapter

Bootstrap an external adapter with this package

## Caching

To cache data, every adapter using the `bootstrap` package, has access to a simple LRU cache that will cache successful 200 responses using SHA1 hash of input as a key.

To configure caching these environment variables are available:

- `CACHE_ENABLED`: Optional bool, defaults to `false`. Set to `true` to enable the cache.
- `CACHE_TYPE`: Optional string, defaults to `local`. Available options: `local|redis`
- `CACHE_KEY_GROUP`: Optional string, defaults to UUID of the adapter. Set to specific group ID to group the cached data, for this adapter, with other instances in the same group. Applicable only in remote cache scenarios, where multiple adapter instances share the cache.
- `CACHE_KEY_IGNORED_PROPS`: Optional list of keys to ignore while deriving the cache key, delimited by `,`. The key set will be added to the default ignored keys: `['id', 'maxAge', 'meta']`.

## Local cache

Options:

- `CACHE_MAX_ITEMS`: Optional number, defaults to `500`. The maximum size of the cache, checked by applying the length function to all values in the cache.
- `CACHE_MAX_AGE`: Optional number in ms, defaults to `1000 * 30` (30 seconds). Maximum age in ms. Items are not pro-actively pruned out as they age, but if you try to get an item that is too old, it'll drop it and return undefined instead of giving it to you. If set to `0` the default will be used, and if set to `< 0` entries will not persist in cache.
- `CACHE_UPDATE_AGE_ON_GET`: Optional bool, defaults to `false`. When using time-expiring entries with maxAge, setting this to true will make each item's effective time update to the current time whenever it is retrieved from cache, causing it to not expire. (It can still fall out of cache based on recency of use, of course.)

## Redis cache

Options:

- `CACHE_REDIS_HOST`: Optional number, defaults to `127.0.0.1`. IP address of the Redis server.
- `CACHE_REDIS_PORT`: Optional number, defaults to `6379`. Port of the Redis server.
- `CACHE_REDIS_PATH`: Optional string, defaults to `null`. The UNIX socket string of the Redis server.
- `CACHE_REDIS_URL`: Optional string, defaults to `null`. The URL of the Redis server. Format: `[redis[s]:]//[[user][:password@]][host][:port][/db-number][?db=db-number[&password=bar[&option=value]]]`
- `CACHE_REDIS_PASSWORD`: Optional string, defaults to `null`. The password required for redis auth.
- `CACHE_REDIS_TIMEOUT`: Optional number, defaults to `500`. The timeout in ms if connection to Redis errors or is not responding.
- `CACHE_MAX_AGE`: Optional number in ms, defaults to `1000 * 30` (30 seconds).

For local development run a Redis Docker container:

```bash
docker run -p 6379:6379 --name ea-redis -d redis redis-server --requirepass SUPER_SECRET
```

For **ElastiCache Redis** deployments: if encryption in transit is used, to make a connection `CACHE_REDIS_URL` needs to be set with `rediss://...` protocol.

### Cache key

Cache key is derived by hashing the input object, using the SHA1 hash function, while by default ignoring keys `['id', 'maxAge']`. So for example these few requests will derive the same key:

- `{"id": 1, "data": {"base":"LINK", "quote": "USD"}}`
- `{"id": 2, "data": {"base":"LINK", "quote": "USD", "maxAge": 10000}}`
- `{"id": 3, "data": {"base":"LINK", "quote": "USD"}}`

The `maxAge` input argument can be used to set per item `maxAge` parameter. If not set, or set to `0`, the cache level `maxAge` option will be used. Every time the `maxAge` input argument changes, the item will be cached with the new `maxAge` parameter. To avoid hitting the cache for a specific item set `maxAge: -1` (any value `< 0`).

#### Ignoring keys

If you want to ignore specific input data object keys, to be excluded from key derivation, you can use the `CACHE_KEY_IGNORED_PROPS` environment variable.

For example, if the `CACHE_KEY_IGNORED_PROPS=timestamp` is set, these requests will derive the same key:

- `{"id": 1, "data": {"base":"LINK", "quote": "USD", "timestamp": 1598874704}}`
- `{"id": 2, "data": {"base":"LINK", "quote": "USD", "timestamp": 1598874721}}`

### Request coalescing

> One final consideration is the “thundering herd” situation, in which many clients make requests that need the same uncached downstream resource at approximately the same time. This can also occur when a server comes up and joins the fleet with an empty local cache. This results in a large number of requests from each server going to the downstream dependency, which can lead to throttling/brownout. To remedy this issue we use request coalescing, where the servers or external cache ensure that only one pending request is out for uncached resources. Some caching libraries provide support for request coalescing, and some external inline caches (such as Nginx or Varnish) do as well. In addition, request coalescing can be implemented on top of existing caches.
> -- Amazon on [Caching challenges and strategies](https://aws.amazon.com/builders-library/caching-challenges-and-strategies/)

To configure caching these environment variables are available:

- `REQUEST_COALESCING_ENABLED`: Optional bool, defaults to `false`. Set to `true` to enable request coalescing.
- `REQUEST_COALESCING_INTERVAL`: Optional number, defaults to `100`. Interval in milliseconds for exponential back-off function.
- `REQUEST_COALESCING_INTERVAL_MAX`: Optional number, defaults to `1000`. Maximum back-off in milliseconds.
- `REQUEST_COALESCING_INTERVAL_COEFFICIENT`: Optional number, defaults to `2`. A coefficient as the base multiplier for exponential back-off interval function.
- `REQUEST_COALESCING_ENTROPY_MAX`: Optional number, defaults to `0`. Amount of random delay (entropy) in milliseconds that will be added to requests. Avoids issue where the request coalescing key won't be set before multiple other instances in a burst try to access the same key.
