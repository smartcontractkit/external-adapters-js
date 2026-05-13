## Newlines in `PRIVATE_KEY` and `PUBLIC_CERT`

These values are multi-line PEM strings. How you pass them depends on the method:

### `--env-file`

Either escape newlines with `\n`:

```
PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
PUBLIC_CERT="-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----"
```

Or use literal newlines:

```
PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
...
-----END PRIVATE KEY-----"
PUBLIC_CERT="-----BEGIN CERTIFICATE-----
...
-----END CERTIFICATE-----"
```

### Command line

Use ANSI-C quoting (`$'...'`) to interpret `\n`:

```bash
PRIVATE_KEY=$'-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----'
PUBLIC_CERT=$'-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----'
```

Or use single quotes with literal newlines:

```bash
PRIVATE_KEY='-----BEGIN PRIVATE KEY-----
...
-----END PRIVATE KEY-----'
PUBLIC_CERT='-----BEGIN CERTIFICATE-----
...
-----END CERTIFICATE-----'
```
