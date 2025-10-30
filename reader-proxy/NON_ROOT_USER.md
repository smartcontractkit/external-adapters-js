# Running as Non-Root User

The reader-proxy and combined adapter+proxy images are configured to run as the non-root `node` user for security.

## Changes Made

### Dockerfile.with-proxy

- Created `/var/log/supervisor` and `/var/run/supervisor` directories with proper ownership
- Set ownership of all application files to `node:node` using `--chown` flag
- Added `USER node` directive before CMD
- Ensured reader-proxy binary is executable

### supervisord.conf

- Removed `user=root` from supervisord section (runs as invoking user)
- Changed pidfile location to `/var/run/supervisor/supervisord.pid` (writable by node user)
- Added `user=node` to both program sections to explicitly run as node user

## Benefits

✅ **Security**: Reduced attack surface by not running as root  
✅ **Best Practice**: Follows container security guidelines  
✅ **Compliance**: Meets security scanning requirements  
✅ **Isolation**: Limited permissions reduce risk of privilege escalation

## Permissions

The `node` user has:

- Read/write access to `/home/node/app` (application directory)
- Read/write access to `/var/log/supervisor` (logs)
- Read/write access to `/var/run/supervisor` (pid files)
- Execute permission for `/usr/local/bin/reader-proxy` (proxy binary)

## Volume Mounts

If you need to mount volumes, ensure they have the correct permissions:

```bash
# Create volume with proper ownership
docker run -p 8080:8080 \
  -v $(pwd)/data:/home/node/app/data \
  --user node \
  your-adapter:latest

# Or if the volume exists, fix permissions
docker run -p 8080:8080 \
  -v /path/to/data:/home/node/app/data \
  your-adapter:latest

# If you get permission errors, you may need to fix ownership on the host:
sudo chown -R 1000:1000 /path/to/data  # node user UID/GID is typically 1000
```

## Kubernetes

When deploying to Kubernetes, the pod security context is already configured:

```yaml
apiVersion: v1
kind: Pod
spec:
  securityContext:
    runAsNonRoot: true
    runAsUser: 1000 # node user
    fsGroup: 1000
  containers:
    - name: adapter
      image: your-adapter-with-proxy:latest
      securityContext:
        allowPrivilegeEscalation: false
        capabilities:
          drop:
            - ALL
```

## Troubleshooting

### Permission Denied Errors

If you see permission errors:

```bash
# Check if running as root (should show node)
docker exec <container-id> whoami

# Check file permissions
docker exec <container-id> ls -la /home/node/app
docker exec <container-id> ls -la /var/log/supervisor
docker exec <container-id> ls -la /var/run/supervisor
```

### Cannot Write to Logs

The container writes logs to stdout/stderr by default, so this shouldn't be an issue. If you need file-based logs:

```bash
# Ensure log directory is writable
docker run -p 8080:8080 \
  -v $(pwd)/logs:/var/log/supervisor:rw \
  your-adapter:latest

# Fix permissions if needed
chmod 755 logs
```

### PID File Errors

The pid file is in `/var/run/supervisor/supervisord.pid` which is owned by the node user. If you see errors:

```bash
# Check directory permissions
docker exec <container-id> ls -la /var/run/supervisor

# Should show: drwxr-xr-x node node
```

## Security Scanning

The image should now pass most container security scans. To verify:

```bash
# Using Docker Scout
docker scout cves your-adapter:latest

# Using Trivy
trivy image your-adapter:latest

# Using Snyk
snyk container test your-adapter:latest
```

## Reverting to Root (Not Recommended)

If you absolutely need to run as root (not recommended), you can override:

```bash
# Run as root user (defeats security purpose)
docker run --user root -p 8080:8080 your-adapter:latest
```

However, this is **strongly discouraged** and should only be used for debugging.

## Compliance

Running as non-root user helps meet:

- CIS Docker Benchmark 4.1
- NIST 800-190 container security guidelines
- Kubernetes Pod Security Standards (Restricted)
- PCI-DSS container requirements

## Verification

To verify the image runs correctly as non-root:

```bash
# Build the image
./build-with-proxy.sh packages/sources/coingecko @chainlink/coingecko-adapter test-nonroot:latest

# Run it
docker run -d --name test-container -p 8080:8080 test-nonroot:latest

# Check user
docker exec test-container whoami
# Should output: node

# Check processes
docker exec test-container ps aux
# Should show processes running as 'node' user

# Test functionality
curl http://localhost:8080/health

# Check logs
docker logs test-container

# Cleanup
docker stop test-container
docker rm test-container
```

All checks should pass, confirming the container runs securely as a non-root user.
