# Use the official Nginx image as the base image
FROM nginx:alpine

# Copy the custom nginx configuration file
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the static website files to the nginx html directory
COPY index.html /usr/share/nginx/html/
COPY config.js /usr/share/nginx/html/

# Expose port 8080 as required by Cloud Run
EXPOSE 8080

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
