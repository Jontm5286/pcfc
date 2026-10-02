#!/bin/bash
# optimize-images.sh — PCFC + FutbolPro
# Descarga stock URLs → WebP multicheck ×3 breakpoints, lazy + <picture>
# USO:
#   ./scripts/optimize-images.sh            # optimize src/assets/stock/*.{jpg,png}
#   ./scripts/optimize-images.sh --fetch    # también fetch Unsplash URLs en .astro/.tsx
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CWEBP="$(command -v cwebp || true)"
SHARP="$(command -v npx >/dev/null && echo npx || echo '')"

# Breakpoints WebP (móvil, tablet, desktop)
declare -a SIZES=(300 800 1600)

if [ -z "$CWEBP" ]; then
  echo "WARN: Homebrew cwebp not found (brew install webp)"
  echo "Falling back to sharp..."
  USE_SHARP=1
else
  USE_SHARP=0
fi

echo "optimize-images running..."
