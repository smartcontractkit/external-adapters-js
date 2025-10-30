#!/bin/bash

# Build script for creating adapter images with reader-proxy
# Usage: ./build-with-proxy.sh <adapter-path> <package-name> [image-tag]
#
# Examples:
#   ./build-with-proxy.sh packages/sources/coingecko @chainlink/coingecko-adapter
#   ./build-with-proxy.sh packages/sources/coingecko @chainlink/coingecko-adapter coingecko-proxy:v1.0

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check arguments
if [ $# -lt 2 ]; then
    print_error "Usage: $0 <adapter-path> <package-name> [image-tag]"
    echo ""
    echo "Examples:"
    echo "  $0 packages/sources/coingecko @chainlink/coingecko-adapter"
    echo "  $0 packages/sources/coingecko @chainlink/coingecko-adapter coingecko-proxy:v1.0"
    echo "  $0 packages/composites/proof-of-reserves @chainlink/por-adapter por-proxy:latest"
    exit 1
fi

ADAPTER_PATH=$1
PACKAGE_NAME=$2
IMAGE_TAG=${3:-""}

# Validate adapter path exists
if [ ! -d "$ADAPTER_PATH" ]; then
    print_error "Adapter path not found: $ADAPTER_PATH"
    exit 1
fi

# Generate default image tag if not provided
if [ -z "$IMAGE_TAG" ]; then
    # Extract adapter name from path (e.g., packages/sources/coingecko -> coingecko)
    ADAPTER_NAME=$(basename "$ADAPTER_PATH")
    IMAGE_TAG="${ADAPTER_NAME}-adapter-with-proxy:latest"
fi

print_info "Building adapter with reader-proxy"
echo "  Adapter Path: $ADAPTER_PATH"
echo "  Package Name: $PACKAGE_NAME"
echo "  Image Tag:    $IMAGE_TAG"
echo ""

# Check if Dockerfile.with-proxy exists
if [ ! -f "Dockerfile.with-proxy" ]; then
    print_error "Dockerfile.with-proxy not found in current directory"
    print_info "Make sure you're running this script from the repository root"
    exit 1
fi

# Check if reader-proxy directory exists
if [ ! -d "reader-proxy" ]; then
    print_error "reader-proxy directory not found"
    print_info "The reader-proxy Go service must be present to build this image"
    exit 1
fi

# Build the image
print_info "Starting Docker build..."
docker buildx build \
    -f Dockerfile.with-proxy \
    --platform linux/amd64,linux/arm64 \
    --build-arg location="$ADAPTER_PATH" \
    --build-arg package="$PACKAGE_NAME" \
    -t "$IMAGE_TAG" \
    .

if [ $? -eq 0 ]; then
    echo ""
    print_info "✓ Build successful!"
    echo ""
    print_info "Image built: $IMAGE_TAG"
    echo ""
    echo "To run the container:"
    echo "  docker run -p 8080:8080 $IMAGE_TAG"
    echo ""
    echo "To run with custom cache settings:"
    echo "  docker run -p 8080:8080 -e CACHE_TTL=60s -e CACHE_404=true $IMAGE_TAG"
    echo ""
    echo "To view metrics:"
    echo "  curl http://localhost:8080/metrics"
    echo ""
else
    print_error "Build failed"
    exit 1
fi

