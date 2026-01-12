#!/usr/bin/env bash
set -euo pipefail

mkdir -p static/docs

for spec in docs/*.yaml; do
  name="$(basename "$spec" .yaml)"
  npx @redocly/cli@latest build-docs "$spec" -o "static/docs/${name}.html"
done
