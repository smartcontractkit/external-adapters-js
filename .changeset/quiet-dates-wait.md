---
'@chainlink/nav-fund-services-adapter': minor
---

Only limit the queried date range to FundOfficialAccountingLastAvailableDate when the new `limitToOfficialAccountingDate` input parameter is true, and handle a null FundOfficialAccountingLastAvailableDate. This restores the 1.3.0 behaviour for existing feeds, which received stale NAV values in 1.3.2.
