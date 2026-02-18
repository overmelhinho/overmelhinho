FROM node:20-alpine

WORKDIR /app

# Install dependencies based on package.json
COPY package.json package-lock.json* ./

RUN npm install

# Copy source code (optional if using volumes, but good for build checks)
COPY . .

# Expose port for Vite
EXPOSE 5173

# Default command for development
CMD ["npm", "run", "dev", "--", "--host"]
