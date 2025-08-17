# Cronix Trading Terminal

A modern trading terminal with KuCoin integration built as a monorepo with FastAPI backend and React frontend.

## 🚀 Features

### Core Trading Features
- **Real-time Trading**: Live price feeds and order management via WebSocket
- **KuCoin Integration**: Official KuCoin Universal SDK for secure trading
- **Bracket Orders**: Advanced order types with stop loss and take profit levels
- **Draggable Price Lines**: Interactive chart with drag-and-drop price adjustments
- **Modern UI**: Dark-themed React interface with Tailwind CSS
- **Authentication**: JWT-based secure authentication system
- **Admin Panel**: Administrative interface for user and system management

### Risk Management & Position Sizing
- **Order Amount Field**: Specify trades in dollar amounts with automatic quantity calculation
- **Position Size Calculator**: Risk-based position sizing with configurable risk percentage
- **Risk Level Presets**: Conservative (0.25%), Moderate (0.5%), Aggressive (1%)
- **Risk/Reward Analysis**: Real-time calculation with visual indicators
- **Smart Validation**: Prevents invalid price configurations before order submission

### User Experience
- **Toast Notifications**: Professional notification system for all actions
- **Price Validation**: Real-time validation with clear error messages
- **Quick Actions**: One-click buttons to set current market prices
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Persistent Settings**: User preferences saved across sessions

## 🏗️ Architecture

```
cronix/
├── backend/          # FastAPI Python backend
│   ├── app/
│   │   ├── api/      # REST API endpoints
│   │   ├── models/   # Database models
│   │   ├── services/ # Business logic
│   │   └── auth/     # Authentication
│   ├── main.py       # FastAPI application
│   └── requirements.txt
├── frontend/         # React + Vite frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── store/    # Zustand state management
│   │   └── services/ # API services
│   └── package.json
└── docker-compose.yml # Development environment
```

## 🛠️ Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **KuCoin Universal SDK** - Official trading API
- **PostgreSQL** - Primary database
- **Redis** - Caching and pub/sub for WebSocket
- **SQLAlchemy** - Database ORM
- **JWT** - Authentication tokens

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Zustand** - State management with persistence
- **TanStack Query** - Server state management
- **React Hook Form + Zod** - Form handling with validation
- **Lightweight Charts** - Professional trading charts
- **Framer Motion** - Smooth animations
- **Lucide React** - Icon system

### Infrastructure
- **Docker Compose** - Development environment
- **PostgreSQL** - Database
- **Redis** - Cache and message broker

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- Node.js 18+
- Docker & Docker Compose (optional)

### Development Setup

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd cronix
```

2. **Backend Setup**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

3. **Frontend Setup**
```bash
cd frontend
npm install
```

4. **Start Development Servers**

Terminal 1 (Backend):
```bash
cd backend
python main.py
```

Terminal 2 (Frontend):
```bash
cd frontend
npm run dev
```

5. **Access the Application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

### Demo Login
- **Username**: demo
- **Password**: demo

## 🐳 Docker Development

Start all services with Docker Compose:

```bash
docker-compose up -d
```

This will start:
- PostgreSQL database (port 5432)
- Redis (port 6379)
- Backend API (port 8000)
- Frontend (port 3000)
- Celery worker for background tasks

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

### Trading
- `GET /api/trading/portfolio` - Get portfolio overview
- `GET /api/trading/balance` - Get account balances
- `POST /api/trading/orders` - Place new order
- `GET /api/trading/orders` - Get user orders
- `DELETE /api/trading/orders/{id}` - Cancel order
- `GET /api/trading/symbols` - Get trading pairs

### Admin
- `GET /api/admin/users` - Get all users
- `GET /api/admin/system-health` - System health status
- `GET /api/admin/orders` - Get all orders
- `POST /api/admin/users/{id}/toggle-status` - Toggle user status

### WebSocket
- `/ws/{client_id}` - Real-time price feeds and notifications

## 🔧 Configuration

### Environment Variables

Create `.env` files in backend and frontend directories:

**Backend (.env)**
```
DATABASE_URL=postgresql://cronix_user:cronix_password@localhost:5432/cronix
REDIS_URL=redis://localhost:6379
SECRET_KEY=your-secret-key-change-in-production
KUCOIN_API_KEY=your-kucoin-api-key
KUCOIN_SECRET_KEY=your-kucoin-secret
KUCOIN_PASSPHRASE=your-kucoin-passphrase
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 📦 Building for Production

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

### Frontend
```bash
cd frontend
npm run build
npm run preview
```

## 🛡️ Security

- JWT-based authentication
- Encrypted KuCoin API credentials storage
- CORS protection
- Input validation and sanitization
- Rate limiting on API endpoints

## 📈 Monitoring

- Health check endpoints
- Structured logging
- Prometheus metrics (planned)
- Grafana dashboards (planned)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

This software is for educational and development purposes. Trading cryptocurrencies involves risk. Always test thoroughly in sandbox environments before using with real funds.
