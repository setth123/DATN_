# Base image
FROM node:20-alpine AS builder

# Default workdir in the container
WORKDIR /app

# Copy dependency file into the container (caching)
COPY package*.json ./

# Install dependencies without dev dependencies (caching) (run when the image is built)
RUN npm ci 

# Copy source code
COPY . .

RUN npm run build 

#Production image
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]



