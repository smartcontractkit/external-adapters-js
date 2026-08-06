---
'@chainlink/gsr-adapter': patch
---

Fix hourly WebSocket disconnections by implementing proactive token refresh and connection closure. GSR issues 1-hour validity tokens that expire, causing WebSocket disconnections. The adapter now: (1) caches tokens with expiry tracking, (2) schedules reconnection 5 minutes before token expiry, (3) actively closes the WebSocket connection when token expiry threshold is reached by attempting multiple closure methods (transport.close(), transport.ws.close(), transport.\_ws.close(), transport.socket.close()) to ensure the underlying connection is terminated, forcing an immediate reconnection with a fresh token and preventing the 7-minute gap of failed requests that previously occurred.
