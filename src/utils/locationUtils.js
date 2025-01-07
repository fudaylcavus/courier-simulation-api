function interpolatePosition(start, end, fraction) {
  return {
    lat: start[1] + (end[1] - start[1]) * fraction,
    lng: start[0] + (end[0] - start[0]) * fraction,
  };
}

function formatTimeLeft(seconds) {
  if (seconds < 60) {
    return `${Math.round(seconds)} seconds`;
  }
  return `${Math.round(seconds / 60)} minutes`;
}

function calculateCurrentPosition(route, startTime, totalDuration) {
  const now = Date.now();
  const elapsedTime = now - startTime;
  const progress = Math.min(elapsedTime / totalDuration, 1);

  const coordinates = route.geometry.coordinates;
  const steps = route.properties.segments[0].steps;

  const totalPoints = coordinates.length;
  const currentIndex = Math.floor(progress * (totalPoints - 1));
  const nextIndex = Math.min(currentIndex + 1, totalPoints - 1);

  const segmentProgress = (progress * (totalPoints - 1)) % 1;

  const currentCoord = progress >= 1 
    ? coordinates[coordinates.length - 1]
    : interpolatePosition(coordinates[currentIndex], coordinates[nextIndex], segmentProgress);

  const currentStep = steps.find(step => 
    currentIndex >= step.way_points[0] && currentIndex <= step.way_points[1]
  );

  // Calculate time left in seconds
  const timeLeftMs = Math.max(0, totalDuration - elapsedTime);
  const timeLeftSec = timeLeftMs / 1000;

  return {
    lat: currentCoord.lat,
    lng: currentCoord.lng,
    address: currentStep?.name || null,
    progress: Math.round(progress * 100),
    currentStep: currentIndex + 1,
    totalSteps: totalPoints,
    status: progress >= 1 ? 'completed' : 'in_progress',
    timeLeft: formatTimeLeft(timeLeftSec),
    timestamp: now
  };
}

module.exports = {
  calculateCurrentPosition,
};
