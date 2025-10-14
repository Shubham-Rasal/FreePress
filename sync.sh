#!/bin/sh
set -e

# Ensure IPFS API is reachable
if ! curl -s http://127.0.0.1:5001/api/v0/version > /dev/null; then
  echo "$(date): IPFS not ready"
  exit 0
fi

# Check if the directory exists
if [ ! -d "/tmp/output/localhost" ]; then
  echo "$(date): /tmp/output/localhost not found"
  exit 0
fi

# Remove old MFS path if exists
curl -s -X POST "http://127.0.0.1:5001/api/v0/files/rm?arg=/site&recursive=true" || true

# Add new folder
curl -s -X POST "http://127.0.0.1:5001/api/v0/add?recursive=true&to-files=/site&arg=/tmp/static_site/wordpress"

echo "$(date): Added /tmp/output/localhost to /site"
