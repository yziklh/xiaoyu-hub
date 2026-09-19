#!/usr/bin/env bash
# 推送到 GitHub 并触发 CI 打包（推送 v*.*.* tag 后自动构建 Windows / macOS 安装包）
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

REMOTE="${REMOTE:-origin}"
BRANCH="${BRANCH:-main}"
COMMIT_MSG=""
NEW_VERSION=""
MODE="release"   # release | push | tag | local
DRY_RUN=false

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}▶${NC} $*"; }
warn() { echo -e "${YELLOW}⚠${NC} $*"; }
err()  { echo -e "${RED}✖${NC} $*" >&2; }

usage() {
  cat <<'EOF'
用法: ./scripts/release.sh [选项] [版本号]

将代码推送到 GitHub，并通过 tag 触发 GitHub Actions 自动打包。

选项:
  --push          仅推送代码到远程，不创建 tag
  --tag           仅创建并推送 tag（需工作区已提交）
  --local         本地打包（npm run tauri:build），不推送 GitHub
  --dry-run       只预览将要执行的操作
  -m, --message   自定义 git commit 信息
  -h, --help      显示帮助

示例:
  ./scripts/release.sh                    # 用当前版本 v1.0.1 发布
  ./scripts/release.sh 1.0.2              # 升版本 → 提交 → 推送 → 打 tag
  ./scripts/release.sh --push -m "fix: 修复绑定"   # 只推送代码
  ./scripts/release.sh --local              # 本地打包验证

流程说明:
  1. 校验 package.json / Cargo.toml / tauri.conf.json 版本一致
  2. git add & commit（如有未提交改动）
  3. git push origin main
  4. git tag vX.Y.Z && git push origin vX.Y.Z
  5. GitHub Actions 自动构建 Draft Release（约 15~25 分钟）

Release 页面: https://github.com/yziklh/xiaoyu-hub/releases
Actions 页面: https://github.com/yziklh/xiaoyu-hub/actions
EOF
}

run_cmd() {
  if $DRY_RUN; then
    echo "[dry-run] $*"
  else
    "$@"
  fi
}

# 读取当前版本号
get_version() {
  node -p "require('./package.json').version"
}

# 校验三处版本号一致
check_version_sync() {
  local version cargo tauri
  version="$(get_version)"
  cargo="$(grep '^version = ' src-tauri/Cargo.toml | head -1 | sed 's/version = "\(.*\)"/\1/')"
  tauri="$(node -p "require('./src-tauri/tauri.conf.json').version")"

  if [[ "$version" != "$cargo" || "$version" != "$tauri" ]]; then
    err "版本号不一致！"
    echo "  package.json:      $version"
    echo "  Cargo.toml:        $cargo"
    echo "  tauri.conf.json:   $tauri"
    echo "  请运行: npm run bump -- <版本号>"
    exit 1
  fi
  echo "$version"
}

# 检查必要工具
check_prerequisites() {
  local missing=()
  for cmd in git node npm; do
    command -v "$cmd" >/dev/null 2>&1 || missing+=("$cmd")
  done
  if ((${#missing[@]} > 0)); then
    err "缺少依赖: ${missing[*]}"
    exit 1
  fi
  if [[ "$MODE" == "local" ]] && ! command -v cargo >/dev/null 2>&1; then
    err "本地打包需要安装 Rust (cargo)"
    exit 1
  fi
}

# 解析参数
while [[ $# -gt 0 ]]; do
  case "$1" in
    --push)   MODE="push"; shift ;;
    --tag)    MODE="tag"; shift ;;
    --local)  MODE="local"; shift ;;
    --dry-run) DRY_RUN=true; shift ;;
    -m|--message) COMMIT_MSG="$2"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    -*) err "未知选项: $1"; usage; exit 1 ;;
    *)
      if [[ -n "$NEW_VERSION" ]]; then
        err "只能指定一个版本号"
        exit 1
      fi
      NEW_VERSION="$1"
      shift
      ;;
  esac
done

check_prerequisites

# ── 本地打包模式 ──
if [[ "$MODE" == "local" ]]; then
  log "本地打包模式"
  if [[ ! -d node_modules ]]; then
    log "安装依赖..."
    run_cmd npm ci
  fi
  log "开始构建（可能需要 5~15 分钟）..."
  run_cmd npm run tauri:build
  log "构建完成，产物目录:"
  find src-tauri/target -path '*/bundle/*' \( -name '*.exe' -o -name '*.dmg' -o -name '*.msi' \) 2>/dev/null || true
  exit 0
fi

# ── 升版本 ──
if [[ -n "$NEW_VERSION" ]]; then
  log "升级版本 → $NEW_VERSION"
  run_cmd node bump-version.cjs "$NEW_VERSION"
fi

VERSION="$(check_version_sync)"
TAG="v${VERSION}"
log "当前版本: $VERSION ($TAG)"

# ── 提交未保存的改动 ──
if ! git diff --quiet || ! git diff --cached --quiet || [[ -n "$(git ls-files --others --exclude-standard)" ]]; then
  DEFAULT_MSG="chore: release ${TAG}"
  MSG="${COMMIT_MSG:-$DEFAULT_MSG}"
  log "提交工作区改动..."
  run_cmd git add -A
  # 排除不应提交的文件
  run_cmd git reset HEAD -- signing-keys.local.md .env .env.local 2>/dev/null || true
  if $DRY_RUN || ! git diff --cached --quiet; then
    run_cmd git commit -m "$MSG"
  else
    warn "暂无可提交的改动，跳过 commit"
  fi
elif [[ -n "$COMMIT_MSG" ]]; then
  warn "工作区干净，忽略 --message"
fi

# ── 推送代码 ──
if [[ "$MODE" != "tag" ]]; then
  log "推送到 ${REMOTE}/${BRANCH} ..."
  run_cmd git push "$REMOTE" "$BRANCH"
fi

# ── 创建并推送 tag（触发 CI 打包）──
if [[ "$MODE" != "push" ]]; then
  if git rev-parse "$TAG" >/dev/null 2>&1; then
    err "Tag $TAG 已存在，请升级版本号后重试"
    echo "  删除旧 tag: git tag -d $TAG && git push $REMOTE :refs/tags/$TAG"
    exit 1
  fi

  log "创建 tag $TAG ..."
  run_cmd git tag -a "$TAG" -m "Release $TAG"

  log "推送 tag（触发 GitHub Actions 打包）..."
  run_cmd git push "$REMOTE" "$TAG"
fi

# ── 完成提示 ──
REPO_URL="$(git remote get-url "$REMOTE" 2>/dev/null | sed -E 's|git@github.com:|https://github.com/|; s|\.git$||')"
echo ""
log "✅ 完成！"
if [[ "$MODE" != "push" ]]; then
  echo ""
  echo "  GitHub Actions 正在构建，约 15~25 分钟后可在 Draft Release 下载安装包："
  echo "  ${REPO_URL}/actions"
  echo "  ${REPO_URL}/releases"
  echo ""
  warn "构建完成后需手动在 Releases 页面点击 Publish 发布"
fi
