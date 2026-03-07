# ─── STAGE 1: Build React App ────────────────────────
FROM node:20-alpine AS build
WORKDIR /app
 
# Copy package files first (for Docker caching)
COPY package.json package-lock.json ./
RUN npm ci --silent

ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL:-http://localhost:5000}
 
# Copy source and build
COPY . .
RUN npm run build
 
# ─── STAGE 2: Serve with Nginx ────────────────────────
FROM nginx:alpine AS runtime
 
# Copy Nginx config
COPY default.conf.template /etc/nginx/templates/default.conf.template
 
# Copy React build output
COPY --from=build /app/dist /usr/share/nginx/html
 
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
