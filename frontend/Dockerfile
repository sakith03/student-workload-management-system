# ─── STAGE 1: Build React App ────────────────────────
FROM node:20-alpine AS build
WORKDIR /app
 
# Copy package files first (for Docker caching)
COPY package.json package-lock.json ./
RUN npm ci --silent
 
# Copy source and build
COPY . .
RUN npm run build
 
# ─── STAGE 2: Serve with Nginx ────────────────────────
FROM nginx:alpine AS runtime
 
# Copy Nginx config
COPY default.conf.template /etc/nginx/templates/default.conf.template
 
# Copy React build output
COPY --from=build /app/build /usr/share/nginx/html
 
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
