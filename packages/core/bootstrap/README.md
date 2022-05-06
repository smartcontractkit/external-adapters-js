# Chainlink External Adapter Bootstrap

The core framework that every External Adapter uses.

The goal of the framework is to make the overall system more efficient by using as few resources (e.g. API credits, networking traffic, CPU usage) as possible to fetch data.

For more information on a specific middleware or module see its dedicated README.

## Middlewares

To fulfill the performance goals each External Adapter's data provider specific logic, called an `execute` function, is wrapped by middlewares that layer in additional functionality.

Middlewares are first initialized to wrap the request. At runtime the execution happens in reverse order. If there is awaited code within the middleware it then happens in the original order once the `execute` function has returned.

![Middleware diagram](./assets/middleware_flow.jpg?raw=true 'Middleware execution')

Some examples of these are:

### Caching

Local cache (LRU) and Redis supported. Local cache can be used as a fallback.

### Cache Warming

For REST requests, cache warming is fired within the chain of observables from the redux architecture. WebSockets are treated as its own cache warming.

### Batching

Batching is directly tied to the caching and cache warming implementation. Each adapter that utilizes batch endpoints also implements DP specific code to handle those use cases.

### Rate limiting

Rate limiting is implemented in 3 parts:

1. An express middleware that rate limits incoming requests and delays/throttles them.
2. A redux middleware, named `Burst Limit`, that uses the same store that caching and batching rely on to check overall reqs per second/minute, and rejects them if they exceed a burst threshold.
3. Another redux middleware, named `Rate Limit` with the same store that adjusts TTL according to the monthly limits.

### Error Backoff

If the adapter receives erroneous responses from the DP beyond a certain threshold, it rejects incoming requests until the specified time window passes.

## Architecture

![EA framework flow](./assets/flowchart.jpg?raw=true 'Framework flowchart')

## Configuration

Detailed here is optional configuration that can be provided to any EA through environment variables.

### Table of Contents

- [Chainlink External Adapter Bootstrap](#chainlink-external-adapter-bootstrap)
  - [Table of Contents](#table-of-contents)
  - [Server configuration](#server-configuration)
  - [Performance](#performance)
    - [Error back offs](#error-back-offs)
    - [Caching](#caching)
    - [Cache key](#cache-key)
      - [Ignoring keys](#ignoring-keys)
    - [Local cache](#local-cache)
    - [Redis](#redis)
    - [Rate Limiting](#rate-limiting)
      - [Provider Limits](#provider-limits)
    - [Cache Warming](#cache-warming)
    - [Request Coalescing](#request-coalescing)
  - [Metrics](#metrics)
  - [Websockets](#websockets)

---

## Server configuration

| Required? |       Name        |                                                                                                                                                                                           Description                                                                                                                                                                                           |         Options          |     Defaults to      |
| :-------: | :---------------: | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :----------------------: | :------------------: |
|           |    `BASE_URL`     | Set a base url that is used for setting up routes on the external adapter. Ex. Typically a external adapter is served on the root, so you would make requests to `/`, setting `BASE_URL` to `/coingecko` would instead have requests made to `/coingecko`. Useful when multiple external adapters are being hosted under the same domain, and path mapping is being used to route between them. |                          |         `/`          |
|           |     `EA_PORT`     |                                                                                                                                                                        The port to run the external adapter's server on                                                                                                                                                                         |                          |        `8080`        |
|           |      `UUID`       |                                                                                                                                                                 A universally unique identifier that is used to identify the EA                                                                                                                                                                 |                          | (generated randomly) |
|           |      `DEBUG`      |                                                                                                                                                                                       Toggles debug mode.                                                                                                                                                                                       |                          |       `false`        |
|           |    `NODE_ENV`     |                                                                                                                                          Toggles development mode. When set to developement the log messages will be prettified to be more read-able.                                                                                                                                           |      `development`       |      undefined       |
|           |    `LOG_LEVEL`    |                                                                                                                                               The [winston](https://github.com/winstonjs/winston) log level. Set to debug for full log messages.                                                                                                                                                | `info`, `debug`, `trace` |        `info`        |
|           |   `API_TIMEOUT`   |                                                                                                                                                      The number of milliseconds a request can be pending before returning a timeout error.                                                                                                                                                      |                          |       `30000`        |
|           |  `API_ENDPOINT`   |                                                                                                                                                                              Override the base URL within the EA.                                                                                                                                                                               |                          |    Defined in EA     |
|           | `WS_API_ENDPOINT` |                                                                                                                                                                         Override the base websocket URL within the EA.                                                                                                                                                                          |                          |    Defined in EA     |
|           |   `API_VERBOSE`   |                                                                                                                              Toggle whether the response from the EA should contain just the results or also include the full response body from the queried API.                                                                                                                               |                          |       `false`        |

### Base input parameters

Base input parameters are accepted for every EA

| Required? | Name             | Description                                                                                           |
| --------- | ---------------- | ----------------------------------------------------------------------------------------------------- |
|           | `endpoint`       | The External Adapter "endpoint" name to use.                                                          |
|           | `resultPath`     | The path to key into the API response the retrieve the result                                         |
|           | `overrides`      | Override the mapping of token symbols to another token symbol                                         |
|           | `tokenOverrides` | Override the mapping of token symbols to smart contract address                                       |
|           | `includes`       | Override the array of includes that holds additional input parameters when matching a pair of symbols |

## Performance

### Error back offs

Repeated requests that return errors are backed off from:
| Required? | Name | Description | Options | Defaults to |
| :-------: | :-------------------: | :-------------------------------------: | :-----: | :---------: |
| | `ERROR_CAPACITY` | Maximum amount of time a request can error per minute before being backed off from | | `2` |

### Caching

To cache data every adapter using the `bootstrap` package has access to a simple LRU cache that will cache successful 200 responses using SHA1 hash of input as a key.

> ### ⚠️ Note
>
> Please check and ensure caching is allowed and not in violation of the Terms of Service of the data provider's API. Disable caching flags if it is not supported by the specified API provider's TOS.

To configure caching these environment variables are available:

| Required? |           Name            |                                                                                                                                     Description                                                                                                                                     |      Options       |                              Defaults to                              |
| :-------: | :-----------------------: | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :----------------: | :-------------------------------------------------------------------: |
|           |      `CACHE_ENABLED`      |                                                                                                                                   Toggle caching.                                                                                                                                   |                    |                                `true`                                 |
|           |       `CACHE_TYPE`        |                                                                                                                          Which cache type should be used.                                                                                                                           | `local` or `redis` |                                `local`                                |
|           |     `CACHE_KEY_GROUP`     |                                      Set to specific group ID to group the cached data, for this adapter, with other instances in the same group. Applicable only in remote cache scenarios, where multiple adapter instances share the cache.                                      |                    |                          UUID of the adapter                          |
|           | `CACHE_KEY_IGNORED_PROPS` |                                                                                Keys to ignore while deriving the cache key, delimited by `,`. The key set will be added to the default ignored keys                                                                                 |                    | `['id', 'maxAge', 'meta', 'rateLimitMaxAge', 'debug', 'metricsMeta']` |
|           |      `CACHE_MAX_AGE`      | Maximum age in ms. Items are not pro-actively pruned out as they age, but if you try to get an item that is too old, it'll drop it and return undefined instead of giving it to you. If set to `0` the default will be used, and if set to `< 0` entries will not persist in cache. |                    |                         `90000` (1.5 minutes)                         |
|           |      `CACHE_MIN_AGE`      |                                                                                                                                 Minimum age in ms.                                                                                                                                  |                    |                         `30000` (30 seconds)                          |

### Cache key

The cache key of a stored request is derived by hashing the input object, using the SHA1 hash function, while by default ignoring keys `['id', 'maxAge', 'meta', 'rateLimitMaxAge', 'debug']`. So for example these few requests will derive the same key:

- `{"id": 1, "data": {"base":"LINK", "quote": "USD"}}`
- `{"id": 2, "data": {"base":"LINK", "quote": "USD", "maxAge": 10000}}`
- `{"id": 3, "data": {"base":"LINK", "quote": "USD"}}`

The `maxAge` input argument can be used to set per item `maxAge` parameter. If not set, or set to `0`, the cache level `maxAge` option will be used. Every time the `maxAge` input argument changes, the item will be cached with the new `maxAge` parameter. To avoid hitting the cache for a specific item set `maxAge: -1` (any value `< 0`).

#### Ignoring keys

If you want to ignore specific input data object keys, to be excluded from key derivation, you can use the `CACHE_KEY_IGNORED_PROPS` environment variable.

For example, if the `CACHE_KEY_IGNORED_PROPS=timestamp` is set, these requests will derive the same key:

- `{"id": 1, "data": {"base":"LINK", "quote": "USD", "timestamp": 1598874704}}`
- `{"id": 2, "data": {"base":"LINK", "quote": "USD", "timestamp": 1598874721}}`

### Local cache

| Required? |           Name            |                                                                                                                              Description                                                                                                                               | Options | Defaults to |
| :-------: | :-----------------------: | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :-----: | :---------: |
|           |     `CACHE_MAX_ITEMS`     |                                                                                   The maximum size of the cache, checked by applying the length function to all values in the cache.                                                                                   |         |   `1000`    |
|           | `CACHE_UPDATE_AGE_ON_GET` | When using time-expiring entries with maxAge, setting this to true will make each item's effective time update to the current time whenever it is retrieved from cache, causing it to not expire. (It can still fall out of cache based on recency of use, of course.) |         |   `false`   |

### Redis

| Required? |                 Name                 |                                                                   Description                                                                   | Options | Defaults to |
| :-------: | :----------------------------------: | :---------------------------------------------------------------------------------------------------------------------------------------------: | :-----: | :---------: |
|           |   `CACHE_REDIS_CONNECTION_TIMEOUT`   |                                             Timeout to end socket connection due to inactivity (ms)                                             |         |   `15000`   |
|           |          `CACHE_REDIS_HOST`          |                                                         IP address of the Redis server.                                                         |         | `127.0.0.1` |
|           |    `CACHE_REDIS_MAX_QUEUED_ITEMS`    |                                              Maximum length of the client's internal command queue                                              |         |     100     |
|           | `CACHE_REDIS_MAX_RECONNECT_COOLDOWN` |                                              Max cooldown time before attempting to reconnect (ms)                                              |         |   `3000`    |
|           |          `CACHE_REDIS_PORT`          |                                                            Port of the Redis server.                                                            |         |   `6379`    |
|           |          `CACHE_REDIS_PATH`          |                                                   The UNIX socket string of the Redis server.                                                   |         |  undefined  |
|           |          `CACHE_REDIS_URL`           | The URL of the Redis server. Format: `[redis[s]:]//[[user][:password@]][host][:port][/db-number][?db=db-number[&password=bar[&option=value]]]`. |         |  undefined  |
|           |        `CACHE_REDIS_PASSWORD`        |                                                      The password required for redis auth.                                                      |         |   `null`    |
|           |        `CACHE_REDIS_TIMEOUT`         |                                           Timeout to fail a Redis server request if no response (ms)                                            |         |    `500`    |

For local development run a Redis Docker container:

```bash
docker run -p 6379:6379 --name ea-redis -d redis redis-server --requirepass SUPER_SECRET
```

For **ElastiCache Redis** deployments: if encryption in transit is used, to make a connection `CACHE_REDIS_URL` needs to be set with `rediss://...` protocol.

### Rate Limiting

To avoid hitting rate limit issues with the data provider subscription, a rate limit capacity per minute can be set:

| Required? |         Name         |            Description             | Options | Defaults to |
| :-------: | :------------------: | :--------------------------------: | :-----: | :---------: |
|           | `RATE_LIMIT_ENABLED` | Enabling Rate Limit functionality. |         |   `true`    |

- Option 1, manual capacity setting:

  | Required? |         Name          |               Description               | Options | Defaults to |
  | :-------: | :-------------------: | :-------------------------------------: | :-----: | :---------: |
  |           | `RATE_LIMIT_CAPACITY` | Maximum capacity on requests per minute |         |  undefined  |

- Option 2, capacity by reference. Check your plan [here](./src/lib/provider-limits/limits.json) and use it with the following configuration:

| Required? |           Name            |         Description         | Options |                   Defaults to                    |
| :-------: | :-----------------------: | :-------------------------: | :-----: | :----------------------------------------------: |
|           | `RATE_LIMIT_API_PROVIDER` |    Name of the provider.    |         | The derived name of the running External Adapter |
|           |   `RATE_LIMIT_API_TIER`   | Plan you are subscribed to. |         |                    undefined                     |

#### Provider Limits

Each provider is defined within [limits.json](./src/lib/provider-limits/limits.json) as so:

```json
{
  "[provider-name]": {
    "http": {
      "[plan-name]": {
        "rateLimit1s": 1,
        "rateLimit1m": 30,
        "rateLimit1h": 200
      },
      "premium": {
        "rateLimit1s": 10,
        "rateLimit1m": 300,
        "rateLimit1h": 2000
      }
    },
    "ws": {
      "[plan-name]": {
        "connections": 1,
        "subscriptions": 10
      }
    }
  }, {...}
}
```

Being:

- **provider-name**: The provider name. E.g. "amberdata" or "coinmarketcap"
- **plan-name**: The provider plan name. Used as a identifier for the plan. E.g. "free" or "premium"
- There are two protocols with different limit types:
  - **http**: With `rateLimit1s`, `rateLimit1m`, `rateLimit1h`, which stands for requests per second/minute/hour respectively. If only one is provided, the rest would be calculated based on it.
  - **ws**: Websocket limits, which accepts: `connections` and `subscriptions`. If websockets are not supported on the provider, can be left empty as `ws: {}`

### Cache Warming

\*To use this feature the `CACHE_ENABLED` environment variable must also be enabled.

| Required? |             Name             |                                                                                                   Description                                                                                                   | Options |             Defaults to             |
| :-------: | :--------------------------: | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :-----: | :---------------------------------: |
|           |       `WARMUP_ENABLED`       |                                                                                     Enable the cache warmer functionality.                                                                                      |         |               `true`                |
|           | `WARMUP_UNHEALTHY_THRESHOLD` |                                   The number of times a warmup execution can fail before we drop a warmup subscription for a particular cache key.to. Set to `-1` to disable.                                   |         |                 `3`                 |
|           |  `WARMUP_SUBSCRIPTION_TTL`   |                          The maximum duration between requests for a cache key to an external adapter before the cache warmer will unsubscribe from warming up a particular cache key.                          |         |         `3600000` (1 hour)          |
|           |      `WARMUP_INTERVAL`       | The interval (in ms) at which the cache warmer should send requests to warm the cache. Prioritizes hard-coded max age, then `WARMUP_INTERVAL` environment variable, lastly the calculated TTL of a cache entry. |         | The cache's minimum TTL (30,000 ms) |

### Request Coalescing

> One final consideration is the “thundering herd” situation, in which many clients make requests that need the same uncached downstream resource at approximately the same time. This can also occur when a server comes up and joins the fleet with an empty local cache. This results in a large number of requests from each server going to the downstream dependency, which can lead to throttling/brownout. To remedy this issue we use request coalescing, where the servers or external cache ensure that only one pending request is out for uncached resources. Some caching libraries provide support for request coalescing, and some external inline caches (such as Nginx or Varnish) do as well. In addition, request coalescing can be implemented on top of existing caches.
> -- Amazon on [Caching challenges and strategies](https://aws.amazon.com/builders-library/caching-challenges-and-strategies/)

To configure caching these environment variables are available:

| Required? |                   Name                    |                                                                                                    Description                                                                                                     | Options | Defaults to |
| :-------: | :---------------------------------------: | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :-----: | :---------: |
|           |       `REQUEST_COALESCING_ENABLED`        |                                                                                             Enable request coalescing.                                                                                             |         |   `false`   |
|           |       `REQUEST_COALESCING_INTERVAL`       |                                                                            Interval in milliseconds for exponential back-off function.                                                                             |         |    `100`    |
|           |     `REQUEST_COALESCING_INTERVAL_MAX`     |                                                                                         Maximum back-off in milliseconds.                                                                                          |         |   `1000`    |
|           | `REQUEST_COALESCING_INTERVAL_COEFFICIENT` |                                                                  A coefficient as the base multiplier for exponential back-off interval function.                                                                  |         |     `2`     |
|           |     `REQUEST_COALESCING_ENTROPY_MAX`      | Amount of random delay (entropy) in milliseconds that will be added to requests. Avoids issue where the request coalescing key won't be set before multiple other instances in a burst try to access the same key. |         |     `0`     |
|           |     `REQUEST_COALESCING_MAX_RETRIES`      |                                                   Maximum number of attempts to wait for the request coalescing key to be deleted before continuing this request                                                   |         |     `5`     |

## Metrics

A metrics server can be exposed which returns prometheus compatible data on the metrics endpoint on the specified port.
When enabled, a metrics endpoint is opened on `/metrics`, which can be prepended with the `BASE_URL` if `METRICS_USE_BASE_URL` is enabled.

\*Please note that this feature is EXPERIMENTAL.

| Required? |              Name              |                                  Description                                   | Options | Defaults to |
| :-------: | :----------------------------: | :----------------------------------------------------------------------------: | :-----: | :---------: |
|           | `EXPERIMENTAL_METRICS_ENABLED` |                  Set to `true` to enable metrics collection.                   |         |   `false`   |
|           |     `METRICS_USE_BASE_URL`     | Set to "true" to have the internal metrics endpoint use the supplied base url. |         |   `false`   |
|           |         `METRICS_PORT`         |                   The port the metrics endpoint is served on                   |         |   `9080`    |
|           |         `METRICS_NAME`         |                    set to apply a label of to each metric.                     |         |  undefined  |

To run Prometheus and Grafana with development setup:

```
yarn dev:metrics
```

## Websockets

Adapters who interact with data providers that support websockets will be able to use them offering a WS interface. Each adapter will have its corresponding WS documentation.

Multiple subscription channels are multiplexed over one connection.

For every type of request, the adapter will subscribe to the corresponding channel.

From the moment the subscription is confirmed, the adapter will start receiving messages with the relevant information, **piping this information to the cache**. On future requests, the adapter will always have **fresh data saved on cache**. If there is no data available in cache, the adapter will continue with its default execution.

| Required? |                Name                |                                                                             Description                                                                              | Options | Defaults to |
| :-------: | :--------------------------------: | :------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :-----: | :---------: |
|           |            `WS_ENABLED`            |                                               Set this to `true` to enable WS support (on adapters that support this).                                               |         |   `false`   |
|           |       `WS_SUBSCRIPTION_TTL`        |            Subscription expiration time in ms. If no new incoming requests ask for this information during this time, the subscription will be cancelled.            |         |  `120000`   |
|           | `WS_SUBSCRIPTION_UNRESPONSIVE_TTL` | Unresponsive subscription expiration time in ms. If the adapter doesn't receive messages from an open subscription during this time, a resubscription will be tried. |         |  `120000`   |

\*For the websockets to be effective, **caching needs to be enabled**
