#!/bin/bash
# optimize-images.sh — PCFC WebP Image Optimizer
#
# Converts photos referenced in src/content/hero/*.md and src/content/gallery/*.md
# (and local *.jpg/*.jpeg/*.png files dropped into those dirs) to optimized WebP.
#
# Features:
#   - cwebp -q 85 -metadata none (quality 85, strip all metadata)
#   - 400px-width thumbnails (*-400.webp)
#   - MD5 cache: skip if .webp exists and source MD5 matches cache sidecar
#   - --dry-run: preview without downloading or converting
#   - Graceful fallback: if cwebp is missing, print warning + exit 0 (no error)
#
# Usage:
#   bash scripts/optimize-images.sh            # optimize all images
#   bash scripts/optimize-images.sh --dry-run  # preview only (no changes)

set -uo pipefail

# ── Configuration ──────────────────────────────────────────────────
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CWEBP="${CWEBP:-$(command -v cwebp 2>/dev/null || true)}"
QUALITY="${WEBP_QUALITY:-85}"
THUMB_WIDTH="${WEBP_THUMB_WIDTH:-400}"
OUTPUT_DIR="$ROOT/public/images/stock"
CONTENT_DIRS=("src/content/hero" "src/content/gallery")

# ── Argument parsing ───────────────────────────────────────────────
DRY_RUN=false
for arg in "$@"; do
  case "$arg" in
    --dry-run|-n) DRY_RUN=true ;;
    --help|-h)
      sed -n '2,/^$/p' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *)
      echo "Unknown option: $arg"
      echo "Usage: $0 [--dry-run]"
      exit 1
      ;;
  esac
done

# ── Graceful fallback: cwebp not available ──────────────────────────
# Per spec: if cwebp is not installed, print a warning and exit 0
# (no error). This lets the build/CI pipeline continue gracefully.
if [[ -z "$CWEBP" ]]; then
  echo "WARN: cwebp not found (install with 'brew install webp')."
  echo "  Skipping WebP optimization — exiting gracefully (exit 0)."
  exit 0
fi

# ── Check for curl (needed to download remote URLs) ─────────────────
CURL="$(command -v curl 2>/dev/null || true)"
if [[ -z "$CURL" ]]; then
  echo "WARN: curl not found. Remote image URLs cannot be downloaded."
  echo "  Exiting gracefully (exit 0)."
  exit 0
fi

# ── Helper: compute MD5 of a file (portable macOS/Linux) ───────────
compute_md5() {
  local file="$1"
  if command -v md5sum >/dev/null 2>&1; then
    md5sum "$file" 2>/dev/null | awk '{print $1}'
  elif command -v md5 >/dev/null 2>&1; then
    md5 -q "$file" 2>/dev/null
  else
    echo ""
  fi
}

# ── Helper: extract image URLs from YAML frontmatter ──────────────
# Parses .md files looking for src:, backgroundImage:, image:, photo:
# fields that contain http(s):// URLs (skips local /images/... paths).
# Output: one URL per line.
extract_urls() {
  python3 - "$1" <<'PYEOF'
import sys, re

with open(sys.argv[1], encoding="utf-8") as f:
    content = f.read()

# Extract YAML frontmatter delimited by ---
m = re.match(r"^---\n(.*?)\n---", content, re.DOTALL)
if not m:
    sys.exit(0)

fm = m.group(1)

# Match fields: src, backgroundImage, image, photo
# Value can be quoted or unquoted; capture only http(s) URLs
pattern = re.compile(
    r"(?:src|backgroundImage|image|photo)\s*:\s*[\"']?(https?://[^\"'<\s]+)"
)
seen = set()
for match in pattern.finditer(fm):
    url = match.group(1).rstrip("\"',")
    if url not in seen:
        seen.add(url)
        print(url)
PYEOF
}

mkdir -p "$OUTPUT_DIR"

# ── Build source list ────────────────────────────────────────────────
# Temp file holds lines:  URL|basename   or   FILE|filepath|basename
SRCLIST="$(mktemp /tmp/pcfc-srclist.XXXXXX)"
URLLIST="$(mktemp /tmp/pcfc-urls.XXXXXX)"
LOCALLIST="$(mktemp /tmp/pcfc-locals.XXXXXX)"
trap 'rm -f "$SRCLIST" "$URLLIST" "$LOCALLIST"' EXIT

# Process gallery dirs first so their .md filenames take priority
# when URLs overlap with hero galleryImages (dedup by URL).
for dir in "${CONTENT_DIRS[@]}"; do
  full_dir="$ROOT/$dir"
  [[ -d "$full_dir" ]] || continue

  # --- .md files: extract URLs, basename = .md filename ---
  find "$full_dir" -maxdepth 1 -name '*.md' -type f -print0 2>/dev/null \
    | while IFS= read -r -d '' mdfile; do
        bn="$(basename "$mdfile" .md)"
        extract_urls "$mdfile" | while IFS= read -r url; do
          [[ -n "$url" ]] && printf '%s|%s\n' "$url" "$bn" >> "$URLLIST"
        done
      done

  # --- Local image files: jpg/jpeg/png ---
  find "$full_dir" -maxdepth 1 -type f \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' \) -print0 2>/dev/null \
    | while IFS= read -r -d '' imgfile; do
        bn="$(basename "$imgfile")"
        bn="${bn%.*}"
        printf '%s|%s\n' "$imgfile" "$bn" >> "$LOCALLIST"
      done
done

# Deduplicate URLs: keep first occurrence (gallery takes priority over hero)
if [[ -s "$URLLIST" ]]; then
  awk -F'|' '!seen[$1]++' "$URLLIST" >> "$SRCLIST"
fi
if [[ -s "$LOCALLIST" ]]; then
  cat "$LOCALLIST" >> "$SRCLIST"
fi

# ── Summary header ─────────────────────────────────────────────────
total=$(wc -l < "$SRCLIST" 2>/dev/null | tr -d ' ' || echo 0)
if [[ "$total" -eq 0 ]]; then
  echo "PCFC WebP Optimizer — no images found to process."
  echo "  Scanned: ${CONTENT_DIRS[*]}"
  exit 0
fi

echo "PCFC WebP Optimizer"
echo "  Quality:       $QUALITY"
echo "  Thumbnail:     ${THUMB_WIDTH}px wide"
echo "  cwebp:         $CWEBP"
echo "  Output:        $OUTPUT_DIR"
echo "  Sources:       $total  (gallery + hero)"
echo "  Cache:         md5 sidecar files (*.webp.md5)"
[[ "$DRY_RUN" == "true" ]] && echo "  Mode:          DRY RUN (no changes)"
echo ""

# ── Process each source ─────────────────────────────────────────────
count=0
skipped=0
converted=0
failed=0

while IFS='|' read -r src_val basename; do
  count=$((count + 1))
  [[ -z "$src_val" || -z "$basename" ]] && continue

  out_full="$OUTPUT_DIR/${basename}.webp"
  out_thumb="$OUTPUT_DIR/${basename}-400.webp"
  cache_file="$OUTPUT_DIR/${basename}.webp.md5"

  # Determine if source is a remote URL or local file
  is_url=false
  case "$src_val" in
    http://*|https://*) is_url=true ;;
  esac

  # ── DRY RUN: preview without downloading/converting ──
  if [[ "$DRY_RUN" == "true" ]]; then
    if [[ -f "$out_full" && -f "$cache_file" ]]; then
      echo "  [$count/$total] CACHED:  ${basename}.webp (exists + md5 cache present)"
      skipped=$((skipped + 1))
    else
      label="would convert"
      if [[ "$is_url" == "true" ]]; then
        label="would download → WebP q${QUALITY} + ${THUMB_WIDTH}px thumb"
      else
        label="would convert to WebP q${QUALITY} + ${THUMB_WIDTH}px thumb"
      fi
      echo "  [$count/$total] SKIP:  ${basename}.webp not cached — $label"
      echo "           source: $src_val"
      converted=$((converted + 1))
    fi
    continue
  fi

  # ── NORMAL MODE: download (if URL) or use local file ──
  src_file=""
  if [[ "$is_url" == "true" ]]; then
    src_file="$(mktemp /tmp/pcfc-src.XXXXXX)"
    if ! curl -fsSL --max-time 30 "$src_val" -o "$src_file" 2>/dev/null; then
      echo "  [$count/$total] ERROR: download failed: $src_val"
      rm -f "$src_file"
      failed=$((failed + 1))
      continue
    fi
  else
    src_file="$src_val"
  fi

  # Compute source MD5
  src_md5="$(compute_md5 "$src_file")"

  # ── Cache check: skip if .webp exists AND md5 matches ──
  if [[ -f "$out_full" && -f "$cache_file" ]]; then
    cached_md5="$(cat "$cache_file" 2>/dev/null || echo "")"
    if [[ "$cached_md5" == "$src_md5" ]]; then
      echo "  [$count/$total] CACHED:  ${basename}.webp (md5 match — skipped)"
      skipped=$((skipped + 1))
      # Clean up temp download
      [[ "$is_url" == "true" ]] && rm -f "$src_file"
      continue
    fi
  fi

  # ── Convert to WebP (full size, q85, no metadata) ──
  if ! "$CWEBP" -q "$QUALITY" -metadata none "$src_file" -o "$out_full" 2>/dev/null; then
    echo "  [$count/$total] ERROR: cwebp failed: $src_val"
    rm -f "$src_file"
    failed=$((failed + 1))
    continue
  fi

  # ── Generate 400px-width thumbnail ──
  "$CWEBP" -q "$QUALITY" -metadata none -resize "$THUMB_WIDTH" 0 "$src_file" -o "$out_thumb" 2>/dev/null || true

  # ── Cache MD5 ──
  echo "$src_md5" > "$cache_file"

  # Clean up temp download
  [[ "$is_url" == "true" ]] && rm -f "$src_file"

  size_full=$(wc -c < "$out_full" 2>/dev/null | tr -d ' ' || echo "?")
  size_thumb=$(wc -c < "$out_thumb" 2>/dev/null | tr -d ' ' || echo "?")
  echo "  [$count/$total] CONVERTED: ${basename}.webp (${size_full}B) + ${basename}-400.webp (${size_thumb}B)"
  converted=$((converted + 1))

done < "$SRCLIST"

# ── Summary ────────────────────────────────────────────────────────
echo ""
echo "PCFC WebP Optimizer — Done"
echo "  Converted:  $converted"
echo "  Cached:     $skipped"
echo "  Errors:     $failed"
echo "  Total:      $total"

exit 0
