# Base image
FROM node:20-alpine

# Default workdir in the container
WORKDIR /app

# Copy dependency file into the container (caching)
COPY package*.json ./

# Install dependencies without dev dependencies (caching)(run when the image is built)
RUN npm ci --omit=dev

# Copy source code
COPY . .

# create file_uploads directory with p for parents to avoid error if the directory already exists
RUN mkdir -p file_uploads

# Expose port 4000 (inside the container)
EXPOSE 4000

# Run when the container starts
CMD ["npm", "start"]