const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const { calculateCurrentPosition } = require("../utils/locationUtils");

const OPENROUTE_API_URL =
  "https://api.openrouteservice.org/v2/directions/driving-car";
const GEOCODE_API_URL = "https://api.openrouteservice.org/geocode/search";
const activeDrivers = new Map();
const RETRY_LIMIT = 3;
const RETRY_DELAY = 1000; // 1 second
const SIMULATION_SPEED = 20; // 20x faster

// Dummy driver names and license plates for simulation
const driverPool = [
  { name: "John Doe", licensePlate: "ABC123" },
  { name: "Jane Smith", licensePlate: "XYZ789" },
  { name: "Mike Johnson", licensePlate: "DEF456" },
];

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function retryOperation(operation, retryLimit = RETRY_LIMIT) {
  let lastError;

  for (let attempt = 1; attempt <= retryLimit; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      console.log(
        `Attempt ${attempt} failed. ${
          attempt < retryLimit ? "Retrying..." : "No more retries."
        }`
      );

      if (attempt < retryLimit) {
        await sleep(RETRY_DELAY * attempt); // Exponential backoff
      }
    }
  }

  throw lastError;
}

async function getCourier(req, res) {
  const { driverId } = req.params;
  const driver = activeDrivers.get(driverId);

  if (!driver) {
    return res.status(404).json({ error: "Driver not found" });
  }

  const currentPosition = calculateCurrentPosition(
    driver.route,
    driver.startTime,
    driver.totalDuration
  );

  // If position indicates completion, update driver state
  if (currentPosition.status === "completed" && !driver.completed) {
    driver.completed = true;
  }

  return res.json({
    id: driverId,
    name: driver.name,
    licensePlate: driver.licensePlate,
    status: currentPosition.status,
    position: {
      lat: currentPosition.lat,
      lng: currentPosition.lng,
      progress: currentPosition.progress,
      currentStep: currentPosition.currentStep,
      totalSteps: currentPosition.totalSteps,
      address: currentPosition.address || null,
      timeLeft:
        currentPosition.status === "completed"
          ? "0 minutes"
          : currentPosition.timeLeft,
    },
    routeInfo: {
      startAddress: driver.startLocation,
      endAddress: driver.endLocation,
      totalDistance:
        Math.round(driver.route.properties.segments[0].distance / 1000) + " km",
      totalDuration:
        Math.round(driver.route.properties.segments[0].duration / 60) +
        " minutes",
    },
  });
}

async function createOrder(req, res) {
  const { from, to } = req.body;

  if (!from || !to) {
    return res.status(400).json({ error: "Missing from or to address" });
  }

  try {
    // First, geocode the addresses with retry
    const fromCoords = await retryOperation(() => geocodeAddress(from));
    const toCoords = await retryOperation(() => geocodeAddress(to));

    if (!fromCoords || !toCoords) {
      return res.status(400).json({ error: "Could not geocode addresses" });
    }

    // Get route from OpenRoute Service with retry
    const route = await retryOperation(async () => {
      const response = await axios.get(OPENROUTE_API_URL, {
        params: {
          api_key: process.env.OPENROUTE_API_KEY,
          start: `${fromCoords.lon},${fromCoords.lat}`,
          end: `${toCoords.lon},${toCoords.lat}`,
        },
      });

      if (!response.data.features?.[0]) {
        throw new Error("No route found");
      }

      return response;
    });

    const routeData = route.data.features[0];
    const driverId = uuidv4();
    const randomDriver =
      driverPool[Math.floor(Math.random() * driverPool.length)];

    // Calculate a reasonable duration that's shorter for testing
    const simulationDuration =
      (routeData.properties.segments[0].duration * 1000) / SIMULATION_SPEED;

    // Create new driver instance
    activeDrivers.set(driverId, {
      ...randomDriver,
      route: routeData,
      startTime: Date.now(),
      totalDuration: simulationDuration,
      startLocation: from,
      endLocation: to,
      completed: false,
    });

    return res.json({
      id: driverId,
      name: randomDriver.name,
      licensePlate: randomDriver.licensePlate,
      status: "created",
      routeInfo: {
        startAddress: from,
        endAddress: to,
        totalDistance:
          Math.round(routeData.properties.segments[0].distance / 1000) + " km",
        totalDuration:
          Math.round(routeData.properties.segments[0].duration / 60) +
          " minutes",
      },
    });
  } catch (error) {
    console.error("Error creating order:", error);
    return res.status(500).json({ error: "Failed to create order" });
  }
}

async function geocodeAddress(address) {
  const response = await axios.get(GEOCODE_API_URL, {
    params: {
      api_key: process.env.OPENROUTE_API_KEY,
      text: address,
      size: 1,
    },
  });

  if (response.data.features?.length > 0) {
    const [lon, lat] = response.data.features[0].geometry.coordinates;
    return { lon, lat };
  }

  throw new Error(`Could not geocode address: ${address}`);
}

module.exports = {
  getCourier,
  createOrder,
};
