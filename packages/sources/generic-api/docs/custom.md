## Variable env vars

To support a specific value for input parameter `apiName`, the environment variable `<API_NAME>_API_URL`, and optionally `<API_NAME>_AUTH_HEADER` and `<API_NAME>_AUTH_HEADER_VALUE` must be set, where `<API_NAME>` is the upper-snake-case version of the value provided for the `apiName` parameter.

## Custom Environment Variables

| Required? |             Name              |                      Description                      |  Type  |
| :-------: | :---------------------------: | :---------------------------------------------------: | :----: |
|    ✅     |      {API_NAME}\_API_URL      |       The API URL to use for a given `apiUrl`.        | string |
|           |    {API_NAME}\_AUTH_HEADER    | The header to pass the authentication credentials on. | string |
|           | {API_NAME}\_AUTH_HEADER_VALUE | The credentials to pass on the authentication header. | string |

## Rate Limiter

| Feeds    | Effective refresh interval                       |
| -------- | ------------------------------------------------ |
| 1 feed   | ~1 request every 3 seconds                       |
| 20 feeds | ~1 request per minute (all feeds share the pool) |

Adjust the limit based on how many feeds run on this EA and how often your data provider (DP) should be called.

### Overriding the default

You can override the built-in limit with these environment variables (they take precedence over the adapter’s default tier):

| Variable                     | Description                               |
| ---------------------------- | ----------------------------------------- |
| `RATE_LIMIT_CAPACITY_MINUTE` | Max requests per minute (overrides tier). |
| `RATE_LIMIT_CAPACITY_SECOND` | Max requests per second (overrides tier). |

**Example:** You run 20 feeds and want each feed to refresh about every 5 seconds. That’s 20 × 12 = **240 requests per minute**. Set:

```bash
RATE_LIMIT_CAPACITY_MINUTE=240
```
