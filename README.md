# Courier Simulation API

🚚 A real-time courier simulation API for testing delivery applications. Simulates courier movements with real street navigation, live tracking, and accurate ETAs.

[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-404D59?style=flat&logo=express&logoColor=white)](https://expressjs.com/)
[![OpenRoute Service](https://img.shields.io/badge/OpenRoute-Service-blue?style=flat)](https://openrouteservice.org/)

## Overview

A powerful API for simulating courier delivery operations with real-time tracking and route simulation. Perfect for testing delivery applications, this API provides realistic courier movements along actual city routes using OpenRoute Service for accurate street-level navigation.

### Why Use This?
- 🔄 Test your delivery app without real couriers
- 📍 Real street-level navigation and addresses
- ⏱️ Accurate ETAs and distance calculations
- 🚗 Simulated courier movements (20x speed)
- 🗺️ Powered by OpenRoute Service
- 🔌 Simple REST API interface

## Key Features
- Live courier position simulation
- Real-time ETA and progress tracking
- Street-level navigation and addressing
- Automatic courier assignment
- Configurable simulation speed (20x faster)
- Real-world route generation
- Persistent courier state tracking

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory and add your OpenRoute Service API key:
```
OPENROUTE_API_KEY=your_api_key_here
```

## Running the Server

Development mode with auto-reload:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## API Endpoints

### 1. Get Courier Information
```
GET /couriers/:courierId
```

#### Response Type
```typescript
{
  id: string;
  name: string;
  licensePlate: string;
  status: 'in_progress' | 'completed';
  position: {
    lat: number;
    lng: number;
    progress: number;        // 0-100
    currentStep: number;     // current waypoint number
    totalSteps: number;      // total waypoints in route
    address: string | null;  // current street/location name
    timeLeft: string;        // e.g., "5 minutes" or "30 seconds"
  };
  routeInfo: {
    startAddress: string;
    endAddress: string;
    totalDistance: string;   // e.g., "13 km"
    totalDuration: string;   // e.g., "29 minutes"
  };
}
```

### 2. Create New Order
```
POST /order
```

#### Request Type
```typescript
{
  from: string;  // pickup address
  to: string;    // delivery address
}
```

#### Response Type
```typescript
{
  id: string;
  name: string;
  licensePlate: string;
  status: 'created';
  routeInfo: {
    startAddress: string;
    endAddress: string;
    totalDistance: string;   // e.g., "13 km"
    totalDuration: string;   // e.g., "29 minutes"
  };
}
```

## Example Usage

1. Create a new delivery order:
```bash
curl -X POST http://localhost:3000/order \
  -H "Content-Type: application/json" \
  -d '{
    "from": "Schönleinstraße 4, Berlin",
    "to": "Rudower Chausee 25, Berlin"
  }'
```

2. Track courier position:
```bash
curl http://localhost:3000/couriers/COURIER_ID
```

Example Response:
```json
{
  "id": "539f1c26-efc9-4f11-a8b8-4f26f1c7b2f1",
  "name": "Mike Johnson",
  "licensePlate": "DEF456",
  "status": "in_progress",
  "position": {
    "lat": 52.46674429979578,
    "lng": 13.44610386439755,
    "progress": 52,
    "currentStep": 172,
    "totalSteps": 333,
    "address": "Naumburger Straße",
    "timeLeft": "14 minutes"
  },
  "routeInfo": {
    "startAddress": "Schönleinstraße 4",
    "endAddress": "Rudower Chausee 25",
    "totalDistance": "13 km",
    "totalDuration": "29 minutes"
  }
}
```

## Notes
- The simulation runs 20x faster than real-time for testing purposes
- Position updates automatically with each request
- Address information is provided by OpenRoute Service
- Time left is calculated based on the simulation speed 