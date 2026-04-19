# Stage 1: Build the Vite React app
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Copy package files for dependency installation
COPY package*.json ./
RUN npm ci

# Copy the rest of the app source code
COPY . .

# NOTE: The public paystack and API URL environment variables 
# are typically baked into the static build at this step by Vite.
# We will use ARG to allow them to be passed during build.
ARG VITE_PAYSTACK_PUBLIC_KEY
ARG VITE_API_URL

ENV VITE_PAYSTACK_PUBLIC_KEY=$VITE_PAYSTACK_PUBLIC_KEY
ENV VITE_API_URL=$VITE_API_URL

# Build the static HTML/JS/CSS to /dist
RUN npm run build


# Stage 2: Serve the app using NGINX
FROM nginx:alpine

# Remove default nginx config to avoid conflicts
RUN rm -rf /etc/nginx/conf.d/*

# Copy our custom nginx configuration for React Router fallback
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built assets from the builder stage
COPY --from=builder /usr/src/app/dist /usr/share/nginx/html

# Expose HTTP port
EXPOSE 80

# Configure NGINX to run as a non-root user for security
# Alpine nginx creates a 'nginx' user by default
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

USER nginx

CMD ["nginx", "-g", "daemon off;"]
