# FashionAI MVP

Minimal MVP scaffold for an AI wardrobe app.

## Project Structure

- `/mobile-app` - Expo React Native app with 3 screens
- `/backend` - FastAPI server with REST endpoints

## Backend (FastAPI + Supabase Postgres)

### 1) Setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Edit `backend/.env`:

- `DATABASE_URL`: Supabase Postgres connection string
- `API_BASE_URL`: backend URL used to build image URLs (local default: `http://127.0.0.1:8000`)
- `UPLOADS_DIR`: local folder for uploaded images

If you want to run without Supabase first, keep the default fallback sqlite URL by removing `DATABASE_URL`.

### 2) Run backend

```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API base URL: `http://127.0.0.1:8000`

Endpoints:

- `POST /items` (multipart form with image + metadata)
- `GET /items`
- `POST /generate-outfit`

## Mobile App (Expo React Native)

### 1) Setup

```bash
cd mobile-app
npm install
cp .env.example .env
```

Edit `mobile-app/.env` for device testing:

- iOS Simulator can use `http://127.0.0.1:8000`
- Physical device should use your Mac LAN IP, for example `http://192.168.1.12:8000`

### 2) Run mobile app

```bash
cd mobile-app
npm run start
```

Then press:

- `i` for iOS simulator
- `a` for Android emulator
- scan QR for Expo Go on a device

## Milestone Features Included

1. Upload clothing image from mobile (`Add Item` screen)
2. Backend stores image URL
3. Backend creates wardrobe item record
4. Closet screen shows uploaded items in a 2-column grid
5. Outfit generator returns a simple combination (top, bottom, outerwear, shoes, extras)

## Data Model

`wardrobe_items` fields:

- `id`
- `user_id`
- `image_url`
- `category`
- `color`
- `season`
- `formality`

## Quick API Examples

Upload item:

```bash
curl -X POST http://127.0.0.1:8000/items \
  -F "user_id=demo-user" \
  -F "category=top" \
  -F "color=white" \
  -F "season=summer" \
  -F "formality=casual" \
  -F "image=@/path/to/shirt.jpg"
```

List items:

```bash
curl "http://127.0.0.1:8000/items?user_id=demo-user"
```

Generate outfit:

```bash
curl -X POST http://127.0.0.1:8000/generate-outfit -F "user_id=demo-user"
```
