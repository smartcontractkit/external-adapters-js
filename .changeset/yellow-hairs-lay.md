---
'@chainlink/ea-bootstrap': minor
---

Removed UUID environment variable. UUID was used for generating cache group keys. There is no action needed if
you were not using UUID environment variable and/or
running single instance of EA or
using UUID with multiple instances of the same EA with a shared cache.
If you were using UUID to run multiple instances of the same EA with isolated cache, you should use CACHE_KEY_GROUP environment variable instead. Applicable only in remote cache scenarios like when using redis for cache.
