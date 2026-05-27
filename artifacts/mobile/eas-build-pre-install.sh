#!/usr/bin/env bash
set -e

echo "Installing pnpm globally..."
npm install -g pnpm@9.15.4

echo "Installing dependencies with pnpm..."
pnpm install --frozen-lockfile

echo "✓ Dependencies installed successfully"