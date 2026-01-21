# --- Stage 1: Build Angular ---
FROM node:20-alpine as build
WORKDIR /app

# Abhängigkeiten installieren
COPY package*.json ./
RUN npm ci

# Source Code kopieren und bauen
COPY . .
RUN npm run build --configuration=production

# --- Stage 2: Serve with NGINX ---
FROM nginx:alpine

# Kopiere das gebaute Angular-Projekt in den NGINX Ordner
# (Pfad angepasst an deine angular.json Struktur)
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html

# Kopiere unsere NGINX Konfiguration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]