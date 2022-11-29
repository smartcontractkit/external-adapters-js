---
'@chainlink/ea-bootstrap': minor
---

Deprecated the METRICS_NAME env var so the app_name label will always use the adapter name. Current users of this env var would notice metric name changes from their unique one.
Added a warning log when METRICS_ENABLED is set to false.
Added a log to show the full metrics endpoint on startup rather than just the port number.
