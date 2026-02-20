---
'@chainlink/ea-bootstrap': patch
'@chainlink/observation': patch
'@chainlink/ea-scripts': patch
'@chainlink/por-address-list-adapter': patch
---

fix(security): resolve CodeQL code alerts

- js/insecure-randomness: replace Math.random with crypto.randomInt in util
- js/http-to-file-access: validate output filename before file write
- js/indirect-command-line-injection: sanitize branch name for shell
- js/incomplete-sanitization: replace all apostrophes, not first only
- js/prototype-polluting-assignment: skip __proto__/constructor/prototype
