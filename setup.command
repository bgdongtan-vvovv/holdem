#!/bin/bash
# 새 컴퓨터에서 실행(또는: bash setup.command)
cd "$(dirname "$0")"
echo "▶ [holdem] npm 의존성 설치 (node_modules 새로 생성)"
npm install || { echo "Node.js 설치 필요"; exit 1; }
echo "✅ [holdem] 준비 완료.  실행: npm run dev  (또는 package.json scripts 참고)"
