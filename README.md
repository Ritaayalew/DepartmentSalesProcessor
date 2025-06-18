# 📊 High-Performance CSV Processing API (Node.js + React/Next.js)

## 🚀 Overview
This project is a **high-performance backend API** built with **Node.js and Express.js**, designed to process **large CSV files** containing departmental sales data. It aggregates total sales per department and generates a downloadable CSV file with the results.  

A **React or Next.js frontend** is included, allowing users to upload CSV files, track processing progress, and download the final report.

## 📌 Features
- ✅ CSV **file upload via HTTP POST (`/api/upload`)**
- ✅ **Stream-based processing** to handle large files efficiently
- ✅ Aggregates **total sales per department**
- ✅ Saves processed data to a **new CSV file** in the local disc( in the Results folder) 
- ✅ Provides a **downloadable link** once processing is complete
- ✅ **Bull Queue** for background processing
- ✅ Secure API with **rate-limiting & CORS**
- ✅ Fully **typed with TypeScript**
- ✅ Unit tests for core logic with **Jest**

---

## 🏗 Tech Stack
### Backend
- **Node.js** + **Express.js**
- **Bull Queue (Redis)**
- **csv-parser (stream processing)**
- **fs (file handling)**
- **UUIDs for file naming**
- **Rate-limiting middleware**
- **Jest (unit testing)**

### Frontend
- **React / Next.js** (App Router preferred)
- **Axios (HTTP requests)**
- **Progress indicators & status polling**

---

## ⚙️ Installation & Setup
### 1️⃣ Clone the Repository
```bash
git clone https://github.com/your-username/csv-processing-api.git
cd csv-processing-api
```
- ✅ from the root run "npm install"
- ✅ Set Up Environment Variables
The application uses Redis for queue processing. Create a .env file in the root directory by copying the provided template:
Edit .env with your Redis configuration (default values work for a local Redis instance):
```
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```
- ✅ Install and Run Redis
The application requires a running Redis instance. Choose one of the following options:
Local Redis:
macOS/Linux: Install with Homebrew and start Redis:
```
brew install redis
```
redis-server
Windows: Download from redis-windows and run redis-server.exe.
Docker: Run Redis in a container:
```
docker run -d -p 6379:6379 --name redis redis
```

- ✅ from the root run "npm run dev" to activate the server
- ✅ navigate to the front end directory and run "npm run dev"
- ✅ after clicking upload in the screen you wwill see a new updated csv file added to the results folder found in the root.
- ✅ you can only see the files you upload in the uploads folder within the root

