---
'@chainlink/bank-frick-adapter': patch
---

Fix bug where config.pageSize would default to 0 instead of DEFAULT_PAGE_SIZE if PAGE_SIZE was unset
