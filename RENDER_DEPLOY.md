# Render Deployment Configuration

## Quick Deploy Commands

### Option 1: Using render-cli
```bash
# Install render-cli
npm install -g render-cli

# Login
render login

# Deploy
cd backend
render create service --name=fluenzy-backend --type=web --env=python --region=oregon --build-command="pip install -r requirements.txt" --start-command="uvicorn main:app --host 0.0.0.0 --port $PORT"
```

### Option 2: Using GitHub (Recommended)
1. Push your code to GitHub
2. Go to https://dashboard.render.com
3. Click "New" → "Web Service"
4. Connect your repository
5. Configure:
   - Name: `fluenzy-backend`
   - Environment: `Python`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Add environment variable: `PYTHON_VERSION` = `3.11.0`
7. Click "Create Web Service"

## render.yaml Configuration

```yaml
services:
  - type: web
    name: fluenzy-backend
    env: python
    region: oregon
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: PYTHON_VERSION
        value: 3.11.0
    plan: free
```

## Important Production Notes

### 1. Use uvicorn (Not python main.py)
```bash
# ✅ Correct
uvicorn main:app --host 0.0.0.0 --port $PORT

# ❌ Avoid
python main.py
```

### 2. Frontend WebSocket URL
Update [`src/components/VideoAnalysisPanel.tsx`](src/components/VideoAnalysisPanel.tsx) to use dynamic URL:
```typescript
const wsUrl = `ws://localhost:8000/ws/behavioral/${sessionId}`;
// For production, use environment variable or replace with your Render URL
```

### 3. Requirements.txt
Ensure these are in your `backend/requirements.txt`:
```
fastapi
uvicorn
websockets
numpy
opencv-python
```

### 4. CORS Configuration
Update CORS in [`backend/main.py`](backend/main.py) to allow your production domain:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-frontend.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## ⚠️ Render Free Tier Limitations
- Instance sleeps after 15 minutes of inactivity
- First WebSocket connection may fail after sleep
- Consider upgrading to paid plan for production
