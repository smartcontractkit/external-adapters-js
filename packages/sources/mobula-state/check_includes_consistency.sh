#!/bin/bash

# Script to check if the same base symbol has different asset IDs across different quote pairs
# e.g., RSETH/USD should have the same base ID as RSETH/ETH

INCLUDES_FILE="src/config/includes.json"

echo "=== Checking includes.json for inconsistent base asset IDs ==="
echo ""

# Extract: BASE_SYMBOL | BASE_ASSET_ID | QUOTE_SYMBOL
# Structure: .from = base symbol, .to = quote symbol, .includes[].from = base asset ID

jq -r '
  .[] | 
  .from as $base |
  .to as $quote |
  .includes[0].from as $base_id |
  "\($base)|\($base_id)|\($quote)"
' "$INCLUDES_FILE" | sort > /tmp/includes_parsed.txt

echo "Checking for bases with multiple entries..."
echo ""

# Find bases that appear more than once and check consistency
found_issues=0

cut -d'|' -f1 /tmp/includes_parsed.txt | sort | uniq -c | while read count base; do
  if [ "$count" -gt 1 ]; then
    # Get all unique asset IDs for this base
    unique_ids=$(grep "^$base|" /tmp/includes_parsed.txt | cut -d'|' -f2 | sort -u)
    id_count=$(echo "$unique_ids" | wc -l | tr -d ' ')
    
    if [ "$id_count" -gt 1 ]; then
      echo "❌ $base has INCONSISTENT asset IDs:"
      grep "^$base|" /tmp/includes_parsed.txt | while IFS='|' read -r b asset_id quote; do
        echo "   $base/$quote -> base ID: $asset_id"
      done
      echo ""
      found_issues=1
    fi
  fi
done

echo ""
echo "=== Bases with consistent IDs (multiple quotes, same ID) ==="
echo ""

cut -d'|' -f1 /tmp/includes_parsed.txt | sort | uniq -c | while read count base; do
  if [ "$count" -gt 1 ]; then
    unique_ids=$(grep "^$base|" /tmp/includes_parsed.txt | cut -d'|' -f2 | sort -u)
    id_count=$(echo "$unique_ids" | wc -l | tr -d ' ')
    
    if [ "$id_count" -eq 1 ]; then
      quotes=$(grep "^$base|" /tmp/includes_parsed.txt | cut -d'|' -f3 | tr '\n' ', ' | sed 's/,$//')
      echo "✅ $base (ID: $unique_ids) -> quotes: $quotes"
    fi
  fi
done

rm -f /tmp/includes_parsed.txt

echo ""
echo "=== Done ==="
