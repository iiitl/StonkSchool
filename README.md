# Stonk School

A contest-based CFD (Contract for Difference) paper-trading platform. Users authenticate via Google OAuth, join trading contests with entry fees, and trade simulated CFD positions to compete for prizes. Built with Next.js, React, TypeScript, and Tailwind CSS.

## Getting Started

### 1. Backend 

The backend lives in a separate repo: [StonkBackend](https://github.com/Sidharth-Singh10/StonkBackend). Starting it is fairly simple — clone the repo, add a `.env` file, and run `docker compose up --build`. You don't need to make any changes to the backend code.

> **Note:** Running the backend is _not_ required. You can always make changes in the frontend code to bypass backend restrictions and work on the UI independently.

### 2. Frontend

Install dependencies and start the dev server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

Create a `.env.local` file in the project root:

```
NEXT_PUBLIC_AUTH_API_URL=http://localhost:3001
NEXT_PUBLIC_CFD_API_URL=http://localhost:3002
NEXT_PUBLIC_CFD_WS_URL=ws://localhost:3002/ws/prices
```

These point to the backend services. Adjust if your backend is running on different ports or hosts.
