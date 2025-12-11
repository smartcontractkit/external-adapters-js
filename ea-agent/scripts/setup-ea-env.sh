#!/bin/bash
# Setup script for EA development environment
# Can be called from workflow or Python agent

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

cd "$PROJECT_ROOT"

echo "📦 Installing project dependencies..."
yarn install

echo "⚙️ Running yarn setup..."
yarn setup

echo "🔓 Unplugging external adapter framework for agent exploration..."
yarn unplug @chainlink/external-adapter-framework

echo "✅ EA environment setup complete!"

