# 3D Blockchain Visualizer

This project is a simple blockchain demo with a 3D visualizer frontend and a Python backend.

## Results

<img src="Extra/ss1.png" alt="Screenshot 1" width="90%" />
<img src="Extra/ss2.png" alt="Screenshot 2" width="90%" />
<img src="Extra/ss3.png" alt="Screenshot 3" width="90%" />
<img src="Extra/ss4.png" alt="Screenshot 4" width="90%" />
<img src="Extra/ss5.png" alt="Screenshot 5" width="90%" />
<img src="Extra/ss6.png" alt="Screenshot 6" width="90%" />

## Structure

- `backend/` — Flask API server for blockchain logic
- `frontend/` — React app for visualization and interaction

## Getting Started

1. **Start the backend:**
   ```
   cd backend
   python app.py
   ```

2. **Start the frontend:**
   ```
   cd frontend
   npm install
   npm run dev
   ```

3. Open [http://localhost:5173](http://localhost:5173) in your browser.

## Features

- Add transactions to the mempool
- Mine blocks with Proof-of-Work
- Visualize blockchain and block validity
- Tamper with block data and check chain validity

---

For more details, see the code in