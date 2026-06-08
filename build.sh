#!/bin/bash
set -e

# 从 package.json 读取版本号
TAG_VERSION=$(node -p "require('./package.json').version")

if [ -z "$TAG_VERSION" ]; then
    echo "❌ 错误: 无法从 package.json 读取版本号"
    exit 1
fi

echo "▸ 版本号: ${TAG_VERSION}"

# 镜像配置
IMAGE_NAME="${IMAGE_NAME:-repo.hexops.cn/docker-dev/amc-agent}"
PORT="${PORT:-3100}"

echo "▸ 镜像: ${IMAGE_NAME}:${TAG_VERSION}"

echo "▸ 清理旧容器和镜像..."
docker rm -f amc-agent 2>/dev/null || true
docker image rm -f ${IMAGE_NAME}:${TAG_VERSION} 2>/dev/null || true
docker image rm -f ${IMAGE_NAME}:latest 2>/dev/null || true

echo "▸ 安装依赖并构建项目..."
bun install --frozen-lockfile
bun run build

echo "▸ 编译服务端..."
bun build server/index.ts --target=bun --outdir=dist/server

echo "▸ 构建 Docker 镜像..."
echo "   版本: ${TAG_VERSION}"
echo "   端口: ${PORT}"
echo "   平台: linux/amd64"

docker build \
    --platform linux/amd64 \
    --progress=plain \
    --build-arg PORT="${PORT}" \
    -t ${IMAGE_NAME}:${TAG_VERSION} \
    -f ./Dockerfile .

echo "▸ 推送镜像..."
docker push ${IMAGE_NAME}:${TAG_VERSION}
docker tag ${IMAGE_NAME}:${TAG_VERSION} ${IMAGE_NAME}:latest
docker push ${IMAGE_NAME}:latest

echo "✅ 构建完成!"
echo "   镜像: ${IMAGE_NAME}:${TAG_VERSION}"
echo "   镜像: ${IMAGE_NAME}:latest"
