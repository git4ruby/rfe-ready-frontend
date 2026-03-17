# RFE Ready Frontend

Vue 3 + Vite frontend application for RFE Ready - an AI-powered platform for managing immigration Request for Evidence (RFE) cases.

## Overview

Modern, responsive single-page application (SPA) providing a comprehensive interface for immigration attorneys and paralegals to manage RFE cases, collaborate in real-time, and leverage AI-powered document analysis and response generation.

## Technology Stack

- **Framework**: Vue 3 (Composition API with `<script setup>`)
- **Build Tool**: Vite
- **Routing**: Vue Router
- **State Management**: Pinia
- **Styling**: Tailwind CSS
- **Icons**: Heroicons
- **Real-time**: ActionCable (@rails/actioncable)
- **HTTP Client**: Axios
- **Internationalization**: Vue I18n
- **Testing**: Vitest + Vue Test Utils

## Prerequisites

- Node.js 18+ and npm
- Backend API running at `http://localhost:3000` (development) or configured URL (production)

## Local Development Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Create `.env.local` file in the project root:

```bash
# API Base URL
VITE_API_URL=http://localhost:3000

# WebSocket Base URL
VITE_WS_URL=ws://localhost:3000
```

For production, create `.env.production`:

```bash
# API Base URL
VITE_API_URL=https://rfeready.com

# WebSocket Base URL
VITE_WS_URL=wss://rfeready.com
```

### 3. Start Development Server

```bash
npm run dev
```

Application will be available at `http://localhost:5173`

## Available Scripts

### Development
```bash
npm run dev          # Start dev server with hot-reload
```

### Build
```bash
npm run build        # Build for production
npm run preview      # Preview production build locally
```

### Testing
```bash
npm run test         # Run unit tests
npm run test:ui      # Run tests with UI
npm run coverage     # Generate coverage report
```

**Test Coverage**: 451 tests across 40 test files

### Code Quality
```bash
npm run lint         # Run ESLint
npm run lint:fix     # Auto-fix linting issues
npm run format       # Format code with Prettier
```

## Project Structure

```
src/
├── api/              # API client and service modules
│   ├── client.js     # Axios instance with auth interceptors
│   ├── cases.js      # Case management endpoints
│   ├── profile.js    # User profile endpoints
│   └── ...
├── assets/           # Static assets (images, styles)
├── components/       # Reusable Vue components
│   ├── case/         # Case-specific components
│   ├── draft/        # Draft response components
│   └── ...
├── composables/      # Vue composition functions
│   ├── useCable.js   # WebSocket/ActionCable management
│   ├── useIdleTimer.js
│   └── ...
├── locales/          # i18n translation files
│   ├── en.json
│   └── es.json
├── router/           # Vue Router configuration
│   └── index.js
├── stores/           # Pinia state management stores
│   ├── auth.js       # Authentication state
│   ├── cases.js      # Cases state
│   └── ...
├── views/            # Page-level components
│   ├── admin/        # Admin-only views
│   └── ...
├── App.vue           # Root component
└── main.js           # Application entry point
```

## Key Features

### Authentication & Authorization
- JWT-based authentication with automatic token refresh
- Two-factor authentication (2FA) support
- Role-based access control (Super Admin, Admin, Attorney, Paralegal, Viewer)
- Session persistence
- Idle timeout with warning
- Password reset flow

### Case Management
- Create, view, edit, and archive cases
- Upload RFE documents (PDF)
- AI-powered document analysis and classification
- Evidence checklist generation
- Draft response generation (GPT-4)
- Collaborative draft editing with real-time locking
- Export cases to PDF
- Case templates
- Bulk import via CSV

### Real-Time Features (WebSockets)
- Live comment updates (create, edit, delete)
- Real-time notifications
- Collaborative editing presence indicators
- Case status updates broadcast to team

### Knowledge Base
- Upload and manage knowledge documents
- Semantic search using AI embeddings
- Document categorization (case law, precedent, internal memo, etc.)
- Visa type filtering

### Dashboard & Analytics
- Case metrics and statistics
- Cases by status and visa type
- Deadline tracking
- Activity timeline
- Period filtering (7d, 30d, 90d, all time)

### Admin Features
- Tenant management (Super Admin)
- User management
- Feature flags
- Webhooks configuration
- Slack integrations
- Audit logs
- Database backups

### User Experience
- Responsive design (mobile, tablet, desktop)
- Dark mode support (via preferences)
- Internationalization (English, Spanish)
- Keyboard shortcuts
- Toast notifications
- Loading states and skeleton loaders
- Error boundaries

## API Integration

The frontend communicates with the Rails API backend via:

**HTTP Requests**:
- Axios client with JWT token in `Authorization` header
- Automatic token refresh on 401 responses
- Request/response interceptors for error handling

**WebSocket Connections**:
- ActionCable for real-time features
- Token-based authentication for cable connections
- Auto-reconnection on disconnect
- Channels: `NotificationChannel`, `CaseUpdatesChannel`, `DraftEditingChannel`

## State Management

Using Pinia for centralized state:

- `authStore` - User authentication, profile, permissions
- `casesStore` - Case list, filters, pagination
- `notificationStore` - Toast notifications
- `liveNotifications` - Real-time notification state
- `admin` - Admin panel state (tenants, users)
- `preferences` - User preferences

## Real-Time Architecture

```javascript
// Composable for WebSocket management
import { useCable } from '@/composables/useCable'

const { subscribe } = useCable()

// Subscribe to a channel
const subscription = subscribe('CaseUpdatesChannel', {}, {
  received(data) {
    // Handle incoming WebSocket message
  },
  connected() {
    console.log('Connected to channel')
  },
  disconnected() {
    console.log('Disconnected from channel')
  }
})
```

## Routing

Protected routes with authentication guards:

- **Public**: `/login`, `/forgot-password`, `/reset-password`
- **Authenticated**: `/dashboard`, `/cases`, `/knowledge`, `/profile`, etc.
- **Admin Only**: `/admin/*`, `/users`, `/settings`
- **Super Admin Only**: `/admin/tenants`

## Deployment

### Build for Production

```bash
npm run build
```

Output in `dist/` directory.

### Docker Deployment

The production deployment uses Docker with nginx:

```dockerfile
FROM node:18 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
```

### Environment Variables

Production environment variables are set in `.env.production`:

```bash
VITE_API_URL=https://rfeready.com
VITE_WS_URL=wss://rfeready.com
```

### CI/CD

Automatic deployment via GitHub Actions when merged to `main`:

1. **Install dependencies**
2. **Run tests** (required to pass)
3. **Run linter** (required to pass)
4. **Build production assets**
5. **Deploy to production** (Docker container on AWS EC2)

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance Optimizations

- Code splitting with dynamic imports
- Lazy loading of routes and components
- Image optimization
- Gzip compression (nginx)
- Asset caching with far-future expires headers
- Vue 3 Composition API for optimal reactivity
- Debounced search inputs
- Virtual scrolling for large lists (planned)

## Security

- XSS protection (Vue automatic escaping)
- CSRF protection via JWT tokens
- Secure WebSocket connections (WSS)
- Content Security Policy headers (nginx)
- HTTP-only cookies not used (JWT in localStorage)
- Automatic logout on token expiration
- Idle timeout protection

## Accessibility

- Semantic HTML
- ARIA labels where needed
- Keyboard navigation support
- Focus management
- Screen reader compatible

## Troubleshooting

### WebSocket Connection Issues

If WebSocket connections fail:

1. Check `VITE_WS_URL` environment variable
2. Verify backend ActionCable configuration allows your origin
3. Check browser console for connection errors
4. Ensure Cloudflare WebSocket support is enabled (production)

### API Connection Issues

```bash
# Check API URL configuration
echo $VITE_API_URL

# Test API connectivity
curl http://localhost:3000/up
```

### Build Failures

```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf node_modules/.vite
```

## Contributing

1. Create feature branch from `main`
2. Make changes and add tests
3. Run tests: `npm run test`
4. Run linter: `npm run lint`
5. Create pull request to `main`
6. Wait for CI checks to pass
7. Request review and merge

### Branch Protection
- Direct pushes to `main` are blocked
- Pull requests required
- CI checks must pass: `test`, `lint`
- Branches must be up to date before merging

## Testing Real-Time Features

**Live Comments:**
1. Open same case in two browsers (different users)
2. Post/edit/delete comment in one browser
3. Verify instant update in other browser

**Live Notifications:**
1. User A mentions User B in comment (@username)
2. User B sees instant notification

**Collaborative Editing:**
1. Multiple users open same draft response
2. See real-time presence indicators
3. Auto-lock prevents concurrent edits

## License

Proprietary - All rights reserved

## Support

For issues or questions, create an issue in the GitHub repository.
