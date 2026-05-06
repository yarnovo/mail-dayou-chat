#!/usr/bin/env bash
# 一次性 bootstrap chat.xiaohua.agentaily.com OSS + DNS + Let's Encrypt
set -euo pipefail

SUBDOMAIN="${SUBDOMAIN:-chat.xiaohua}"
DOMAIN="${DOMAIN:-agentaily.com}"
BUCKET="${BUCKET:-agentaily-dayou-chat}"
PROFILE="${PROFILE:-hongniang-main}"

SUBDOMAIN="$SUBDOMAIN" DOMAIN="$DOMAIN" BUCKET="$BUCKET" PROFILE="$PROFILE" \
  bash ~/.claude/skills/aliyun-static-site/templates/setup-bucket.sh

echo ""
echo "==> 跑 HTTPS"
SUBDOMAIN="$SUBDOMAIN" DOMAIN="$DOMAIN" BUCKET="$BUCKET" PROFILE="$PROFILE" \
  bash ~/.claude/skills/aliyun-static-site/templates/setup-https.sh
