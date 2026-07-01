#!/usr/bin/env bash
# End-to-end smoke test of the AI Engine over HTTP.
# Usage:  ./smoke.sh            (starts its own server on :4000, then stops it)
#         BASE=http://host ./smoke.sh   (test an already-running server)
set -euo pipefail

BASE="${BASE:-http://localhost:4000}"
OWN_SERVER=0

cleanup() { [ "$OWN_SERVER" = "1" ] && kill "${SRV_PID:-}" 2>/dev/null || true; }
trap cleanup EXIT

# Start a server if one isn't already listening.
if ! curl -sf "$BASE/health" >/dev/null 2>&1; then
  echo "▶ starting server…"
  node --experimental-strip-types src/server.ts >/tmp/a1smoke.log 2>&1 &
  SRV_PID=$!; OWN_SERVER=1
  for _ in $(seq 1 20); do curl -sf "$BASE/health" >/dev/null 2>&1 && break; sleep 0.3; done
fi

jq() { node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const o=JSON.parse(d);console.log(eval('o'+process.argv[1]))})" "$1"; }

echo "── 1. health ───────────────────────────────"
curl -s "$BASE/health"; echo

echo "── 2. create draft + presigned uploads ─────"
CREATE=$(curl -s -X POST "$BASE/v1/quotes" -H 'content-type: application/json' \
  -d '{"serviceType":"kitchen_remodel","regionZip":"90001","imageCount":2}')
QID=$(echo "$CREATE" | jq ".quoteId")
echo "quoteId = $QID"

echo "── 3. confirm images (quality gate) ────────"
curl -s -X POST "$BASE/v1/quotes/$QID/images/confirm" -H 'content-type: application/json' \
  -d '{"images":[{"s3Key":"a.jpg","byteSize":50000,"width":1200,"height":900,"blurScore":120,"brightness":130}]}'; echo

echo "── 4. enqueue estimate (expect 202) ────────"
curl -s -o /dev/null -w "HTTP %{http_code}\n" -X POST "$BASE/v1/quotes/$QID/estimate"

echo "── 5. SSE progress stream ──────────────────"
curl -s -N --max-time 5 "$BASE/v1/quotes/$QID/events" | grep '^data:' || true

echo "── 6. final itemized quote ─────────────────"
curl -s "$BASE/v1/quotes/$QID" | node -e "
let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const q=JSON.parse(d),e=q.estimate;
console.log('status   :',q.status);
console.log('total    : \$'+e.total+'  (range \$'+e.totalLow+' – \$'+e.totalHigh+')');
console.log('confidence:',(e.confidence*100).toFixed(0)+'%');
console.log('line items:',e.lineItems.length);
e.lineItems.forEach(li=>console.log('  '+li.category.padEnd(10),li.item.padEnd(26),'\$'+li.cost));
console.log('framing  :',e.framing);});"

echo "── 7. grounded Q&A ─────────────────────────"
curl -s -X POST "$BASE/v1/quotes/$QID/qa" -H 'content-type: application/json' \
  -d '{"message":"Can you make it cheaper?"}'; echo

echo "── 8. quality gate rejects a bad photo ─────"
Q2=$(curl -s -X POST "$BASE/v1/quotes" -H 'content-type: application/json' -d '{"serviceType":"bathroom_renovation","imageCount":1}' | jq ".quoteId")
curl -s -X POST "$BASE/v1/quotes/$Q2/images/confirm" -H 'content-type: application/json' \
  -d '{"images":[{"s3Key":"dark.jpg","byteSize":50000,"width":1200,"height":900,"blurScore":10,"brightness":20}]}'; echo
echo -n "estimate with no usable images → "; curl -s -o /dev/null -w "HTTP %{http_code} (expect 422)\n" -X POST "$BASE/v1/quotes/$Q2/estimate"

echo "── 9. outcome → self-learning calibration ──"
curl -s -X POST "$BASE/v1/quotes/$QID/outcome" -H 'content-type: application/json' -d '{"finalTotalCents":2400000}' >/dev/null
curl -s "$BASE/v1/admin/calibration/preview"; echo

echo "✅ smoke test complete"
