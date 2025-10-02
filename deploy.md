# Ticket Management Portal - Deployment Guide

## Build Commands

### Development Build
```bash
npm run build:clean
```

### Production Build
```bash
npm run build:prod
```

### Staging Build
```bash
npm run build:staging
```

### Custom Build Script
```bash
node build.js production
node build.js staging
node build.js development
```

## Build Output

The build process creates optimized static files in the `dist/` directory:

- **HTML**: `index.html` - Main entry point
- **JavaScript**: `assets/js/` - Bundled and minified JS files
- **CSS**: `assets/css/` - Optimized stylesheets
- **Assets**: `assets/` - Images, fonts, and other static files

## Deployment Options

### 1. Static Hosting (Recommended)

#### Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

#### Netlify
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist
```

#### GitHub Pages
```bash
# Push to gh-pages branch
npm install --save-dev gh-pages
npm run build
npx gh-pages -d dist
```

### 2. Traditional Web Server

#### Apache (.htaccess)
```apache
RewriteEngine On
RewriteBase /
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

#### Nginx
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 3. Docker Deployment

#### Dockerfile
```dockerfile
FROM nginx:alpine
COPY dist/ /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### Build and Run
```bash
docker build -t ticket-portal .
docker run -p 80:80 ticket-portal
```

## Environment Configuration

### Production Environment Variables
```bash
# API Base URL
VITE_API_BASE_URL=https://api.yourdomain.com

# Environment
NODE_ENV=production
```

### Staging Environment Variables
```bash
# API Base URL
VITE_API_BASE_URL=https://staging-api.yourdomain.com

# Environment
NODE_ENV=staging
```

## Performance Optimization

### Build Optimizations Applied
- ✅ Code splitting for better caching
- ✅ Tree shaking to remove unused code
- ✅ Minification for smaller bundle size
- ✅ Asset optimization
- ✅ CSS code splitting
- ✅ Modern browser targeting (ES2015+)

### Bundle Analysis
```bash
npm run build:analyze
```

## Monitoring and Analytics

### Build Information
Each build includes a `build-info.json` file with:
- Build timestamp
- Version information
- Build configuration
- Node.js version

### Performance Monitoring
Consider adding:
- Google Analytics
- Sentry for error tracking
- Web Vitals monitoring

## Security Considerations

### Content Security Policy
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline'; 
               style-src 'self' 'unsafe-inline';">
```

### HTTPS
- Always use HTTPS in production
- Configure proper SSL certificates
- Enable HSTS headers

## Troubleshooting

### Common Issues

1. **404 on refresh**: Configure server to serve `index.html` for all routes
2. **API calls failing**: Check CORS configuration and API endpoints
3. **Assets not loading**: Verify asset paths and server configuration
4. **Build size too large**: Run bundle analysis and optimize imports

### Debug Commands
```bash
# Check build size
npm run build:analyze

# Preview build locally
npm run preview

# Clean and rebuild
npm run build:clean
```

## Support

For deployment issues or questions, check:
- Build logs in console
- `build-info.json` for build details
- Server error logs
- Network tab in browser dev tools

