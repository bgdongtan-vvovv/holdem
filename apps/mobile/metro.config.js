// npm 워크스페이스 모노레포용 Metro 설정.
// 루트의 packages/* 를 감시하고, 루트 node_modules 도 해석 경로에 추가한다.
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [monorepoRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];
// 워크스페이스 패키지의 "exports" 필드 해석
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
