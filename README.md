# CHITRA: Railway Logo Detection & Extraction

CHITRA is a high-resolution PDF processing engine designed to identify and extract logo bounding boxes (RCC boxes) from technical railway documentation using the YOLO26 model.

## 🚀 Deployment Guide (Ubuntu Server)

### 1. System Requirements
Before running the application, you must install `poppler-utils` to enable PDF-to-Image conversion:
```bash
sudo apt update
sudo apt install poppler-utils -y
```

### 2. Backend Setup
Navigate to the `backend/` directory:
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 3. Frontend Setup
Navigate to the `frontend/` directory:
```bash
cd frontend
npm install
npm run build
```

### 4. Running the Application
**Backend:**
```bash
cd backend
source venv/bin/activate
python3 main.py
```
*(By default, the backend runs on port 8000)*

## 🛠 Features
- **High-Resolution (300 DPI)**: Professional quality output for detailed inspection.
- **Dual-DPI Strategy**: Stable YOLO inference on 100 DPI grayscale thumbnails to eliminate hallucinations.
- **Adaptive UI**: 10x zoom detailed view with pixel-perfect "baked-in" bounding boxes.
- **Sync Logic**: Fully synchronized with refined slicing and NMS parameters.

## 📂 Project Structure
- `backend/`: FastAPI server, YOLO processing logic, and storage.
- `frontend/`: React + Vite application for the user interface.
- `model/`: Contains `best.pt` (YOLO26 weights).
