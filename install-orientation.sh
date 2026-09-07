#!/bin/bash
set -euo pipefail
cd /Volumes/PROGRAM/Projects/holdem
echo "=== installing expo-screen-orientation into @holdem/mobile ===" 
npm install expo-screen-orientation --workspace=@holdem/mobile --legacy-peer-deps --no-audit 2>&1 | tail -20
echo "=== verify ==="
ls node_modules/expo-screen-orientation 2>/dev/null && echo "INSTALLED" || (ls apps/mobile/node_modules/expo-screen-orientation 2>/dev/null && echo "INSTALLED in mobile" || echo "NOT FOUND")
