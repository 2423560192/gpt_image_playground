#!/bin/sh

# 简化配置：只用 API_URL 一个环境变量
# 同时用于：1) 前端显示的默认 API 地址  2) Nginx 代理转发的目标地址
API_URL=${API_URL:-https://ai.xingchai.xyz/}

API_PROXY_AVAILABLE=false
if [ "$ENABLE_API_PROXY" = "true" ]; then
    API_PROXY_AVAILABLE=true
fi

API_PROXY_LOCKED=false
if [ "$ENABLE_API_PROXY" = "true" ] && [ "$LOCK_API_PROXY" = "true" ]; then
    API_PROXY_LOCKED=true
fi

DEFAULT_CONFIG_ONLY=false
if [ "$SHOW_DEFAULT_CONFIG_ONLY" = "true" ]; then
    DEFAULT_CONFIG_ONLY=true
fi

escape_sed_replacement() {
    printf '%s' "$1" | sed 's/[&|\\]/\\&/g'
}

escape_js_string() {
    printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

API_URL_ESCAPED=$(escape_sed_replacement "$(escape_js_string "$API_URL")")

# 查找所有 js 文件并将占位符替换为运行时配置
find /usr/share/nginx/html/assets -type f -name "*.js" -exec sed -i "s|__VITE_DEFAULT_API_URL_PLACEHOLDER__|$API_URL_ESCAPED|g" {} +
find /usr/share/nginx/html/assets -type f -name "*.js" -exec sed -i "s|__VITE_API_PROXY_AVAILABLE_PLACEHOLDER__|$API_PROXY_AVAILABLE|g" {} +
find /usr/share/nginx/html/assets -type f -name "*.js" -exec sed -i "s|__VITE_API_PROXY_LOCKED_PLACEHOLDER__|$API_PROXY_LOCKED|g" {} +
find /usr/share/nginx/html/assets -type f -name "*.js" -exec sed -i "s|__VITE_DOCKER_DEPLOYMENT_PLACEHOLDER__|true|g" {} +
find /usr/share/nginx/html/assets -type f -name "*.js" -exec sed -i "s|__VITE_DOCKER_LEGACY_API_URL_USED_PLACEHOLDER__|false|g" {} +
find /usr/share/nginx/html/assets -type f -name "*.js" -exec sed -i "s|__VITE_SHOW_DEFAULT_CONFIG_ONLY_PLACEHOLDER__|$DEFAULT_CONFIG_ONLY|g" {} +

# 检查是否启用了 API 代理
if [ "$ENABLE_API_PROXY" != "true" ]; then
    # 删除代理配置块
    sed -i '/# BEGIN API PROXY/,/# END API PROXY/d' /etc/nginx/conf.d/default.conf
fi

# 同时将 nginx.conf 中的代理上游地址替换为实际 API_URL
sed -i "s|__API_UPSTREAM_PLACEHOLDER__|$API_URL|g" /etc/nginx/conf.d/default.conf

exec "$@"
