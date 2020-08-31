# Bootstrap Chainlink external adapter

Bootstrap an external adapter with this package

## Caching

To cache data, every adapter using the `bootstrap` package, has access to a simple LRU cache that will cache successful 200 responses using SHA1 hash of input as a key.

To configure caching these environment variables are available:

- `CACHE_ENABLED`: Optional bool, defaults to `false`. Set to `true` to enable the cache.
- `CACHE_MAX_ITEMS`: Optional number, defaults to `500`. The maximum size of the cache, checked by applying the length function to all values in the cache.
- `CACHE_MAX_AGE`: Optional number in ms, defaults to `1000 * 60` (1 minute). Maximum age in ms. Items are not pro-actively pruned out as they age, but if you try to get an item that is too old, it'll drop it and return undefined instead of giving it to you. If set to `0` the default will be used, and if set to `< 0` entries will not persist in cache.
- `CACHE_UPDATE_AGE_ON_GET`: Optional bool, defaults to `false`. When using time-expiring entries with maxAge, setting this to true will make each item's effective time update to the current time whenever it is retrieved from cache, causing it to not expire. (It can still fall out of cache based on recency of use, of course.)
- `CACHE_IGNORED_KEYS`: Optional list of keys to ignore while deriving the cache key, delimited by `,`. The key set will be added to the default ignored keys: `['id', 'maxAge']`.

### Cache key

Cache key is derived by hashing the input object, using the SHA1 hash function, while by default ignoring keys `['id', 'maxAge']`. So for example these few requests will derive the same key:

- `{"id": 1, "data": {"base":"LINK", "quote": "USD"}}`
- `{"id": 2, "data": {"base":"LINK", "quote": "USD", "maxAge": 10000}}`
- `{"id": 3, "data": {"base":"LINK", "quote": "USD"}}`

The `maxAge` input argument can be used to set per item `maxAge` parameter. If not set, or set to `0`, the cache level `maxAge` option will be used. Every time the `maxAge` input argument changes, the item will be cached with the new `maxAge` parameter. To avoid hitting the cache for a specific item set `maxAge: -1` (any value `< 0`).

#### Ignoring keys

If you want to ignore specific input data object keys, to be excluded from key derivation, you can use the `CACHE_IGNORED_KEYS` environment variable.

For example, if the `CACHE_IGNORED_KEYS=timestamp` is set, these requests will derive the same key:

- `{"id": 1, "data": {"base":"LINK", "quote": "USD", "timestamp": 1598874704}}`
- `{"id": 2, "data": {"base":"LINK", "quote": "USD", "timestamp": 1598874721}}`
