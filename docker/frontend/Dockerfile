FROM node:18-alpine AS builder
WORKDIR /build
COPY ruoyi-vue3-myems/ .
RUN npm config set registry https://registry.npmmirror.com \
 && npm ci --fetch-retries=5 --fetch-retry-mintimeout=60000
RUN npm run build:prod

FROM nginx:1.27-alpine
COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /build/dist /usr/share/nginx/html
EXPOSE 80
