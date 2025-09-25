# Multi-stage build for SmartReview

# Backend stage
FROM python:3.11-slim as backend

WORKDIR /app/backend

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ .

# Frontend stage
FROM node:20-slim as frontend

WORKDIR /app/frontend

# Copy package files
COPY frontend/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy frontend code
COPY frontend/ .

# Build the frontend
RUN npm run build

# Final stage
FROM python:3.11-slim

WORKDIR /app

# Install nginx for serving frontend
RUN apt-get update && apt-get install -y nginx && rm -rf /var/lib/apt/lists/*

# Copy backend from backend stage
COPY --from=backend /app/backend /app/backend

# Copy built frontend from frontend stage
COPY --from=frontend /app/frontend/dist /var/www/html

# Copy nginx config
RUN echo 'server {\
    listen 80;\
    server_name localhost;\
    \
    location / {\
        root /var/www/html;\
        try_files $uri $uri/ /index.html;\
    }\
    \
    location /api/ {\
        proxy_pass http://localhost:5000/;\
        proxy_set_header Host $host;\
        proxy_set_header X-Real-IP $remote_addr;\
    }\
}' > /etc/nginx/sites-available/default

# Expose ports
EXPOSE 80

# Start both nginx and flask app
CMD service nginx start && cd backend && python app.py