#!/bin/bash
set -e

echo "Installing dependencies with npm..."
npm install --no-save --legacy-peer-deps

echo "Verifying expo CLI is available..."
which expo || (echo "expo not found, installing globally..." && npm install -g expo)

echo "✓ Dependencies installed successfully"
