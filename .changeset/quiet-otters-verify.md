---
'@chainlink/infralabs-adapter': major
---

Adapted to Infralabs' new nested response format and replaced live AWS KMS key lookups with hardcoded, rotatable public keys configured via `INFRALABS_PUBLIC_KEYS`. Removed the `KMS_*`/`AWS_*` settings and the `@aws-sdk/client-kms` dependency.
