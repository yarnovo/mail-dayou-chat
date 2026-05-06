#!/usr/bin/env bash
# 部 chat.dayou.mail.agentaily.com OSS · 第一次跑前必跑 setup.sh

set -euo pipefail
cd "$(dirname "$0")/.."

ENV="${1:-prod}"
case "$ENV" in
  prod)    BUCKET="${BUCKET:-agentaily-mail-dayou-chat}";    MODE="production" ;;
  staging) BUCKET="${BUCKET:-agentaily-mail-dayou-chat-staging}"; MODE="staging" ;;
  *) echo "用法: $0 [prod|staging]"; exit 1 ;;
esac
PROFILE="${PROFILE:-hongniang-main}"

# build
pnpm install
pnpm run build -- --mode "$MODE"

# upload
aliyun ossutil cp dist/ "oss://$BUCKET/" -r -f --profile "$PROFILE" --cache-control "public, max-age=300, must-revalidate"
aliyun ossutil sync dist/ "oss://$BUCKET/" --delete --update --profile "$PROFILE"

case "$ENV" in
  prod)    echo "✓ deployed → https://chat.dayou.mail.agentaily.com" ;;
  staging) echo "✓ deployed → https://staging.chat.dayou.mail.agentaily.com" ;;
esac
