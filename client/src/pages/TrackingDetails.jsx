import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  CircularProgress,
} from '@mui/material';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MopedIcon from '@mui/icons-material/Moped';

// Custom icons for markers
const restaurantIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3448/3448609.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [35, 35],
  iconAnchor: [17, 35],
  popupAnchor: [0, -35],
  shadowSize: [41, 41],
  shadowAnchor: [13, 41]
});

const houseIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/25/25694.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30],
  shadowSize: [41, 41],
  shadowAnchor: [13, 41]
});

const motorcycleIcon = new L.Icon({
  iconUrl: 'https://static.thenounproject.com/png/638258-200.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28],
  shadowSize: [41, 41],
  shadowAnchor: [13, 41]
});

function ErrorDisplay({ message, onBack }) {
  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: '100%',
            textAlign: 'center',
          }}
        >
          <MopedIcon
            sx={{ fontSize: 48, color: 'error.main', mb: 2 }}
          />
          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            sx={{ fontWeight: 600 }}
            data-testid="error-title"
          >
            Oops!
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ mb: 4 }}
            data-testid="error-message"
          >
            {message}
          </Typography>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={onBack}
            variant="contained"
            size="large"
            data-testid="error-back-button"
            sx={{
              height: 48,
              textTransform: 'none',
              fontSize: '1.1rem',
            }}
          >
            Go Back
          </Button>
        </Paper>
      </Box>
    </Container>
  );
}

function TrackingDetails() {
  const { courierId } = useParams();
  const navigate = useNavigate();
  const [courierData, setCourierData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCourierData = async () => {
      try {
        const response = await fetch(`/couriers/${courierId}`);
        if (!response.ok) {
          throw new Error(
            response.status === 404
              ? 'Courier not found'
              : 'Failed to fetch courier data'
          );
        }
        const data = await response.json();
        setCourierData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCourierData();
    // Poll for updates every 10 seconds
    const interval = setInterval(fetchCourierData, 10000);
    return () => clearInterval(interval);
  }, [courierId]);

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
        data-testid="loading-spinner"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <ErrorDisplay message={error} onBack={() => navigate('/')} />;
  }

  if (!courierData) {
    return <ErrorDisplay message="No data available" onBack={() => navigate('/')} />;
  }

  const { position, routeInfo } = courierData;
  
  // Add validation for coordinates
  const isValidCoord = (lat, lng) => {
    return typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng);
  };

  const currentLocation = position && isValidCoord(position.lat, position.lng) 
    ? { lat: position.lat, lng: position.lng } 
    : null;

  const [startLat, startLng] = routeInfo?.startCoords || [0, 0];
  const [endLat, endLng] = routeInfo?.endCoords || [0, 0];
  
  const startLocation = isValidCoord(startLat, startLng) ? { lat: startLat, lng: startLng } : null;
  const endLocation = isValidCoord(endLat, endLng) ? { lat: endLat, lng: endLng } : null;
  
  // Calculate bounds and center to show all markers
  const calculateMapView = () => {
    const points = [startLocation, currentLocation, endLocation].filter(point => point !== null);
    
    if (points.length === 0) {
      return { center: { lat: 0, lng: 0 }, zoom: 13 };
    }
    
    // Always center on the courier's position if available
    if (currentLocation) {
      return { 
        center: currentLocation,
        // Use a higher zoom level for better visibility of the courier
        zoom: 15
      };
    }
    
    // If no courier location, fallback to showing all points
    if (points.length === 1) {
      return { center: points[0], zoom: 13 };
    }
    
    // Calculate bounds for zoom level only
    const lats = points.map(p => p.lat);
    const lngs = points.map(p => p.lng);
    
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    
    // If no courier location, use center of all points
    const center = {
      lat: (minLat + maxLat) / 2,
      lng: (minLng + maxLng) / 2
    };
    
    return { center, zoom: calculateZoom(points) };
  };

  // Helper function to calculate zoom based on points spread
  const calculateZoom = (points) => {
    if (points.length <= 1) return 13;
    
    const lats = points.map(p => p.lat);
    const lngs = points.map(p => p.lng);
    
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    
    const latDiff = maxLat - minLat;
    const lngDiff = maxLng - minLng;
    const maxDiff = Math.max(latDiff, lngDiff);
    
    // Adjust zoom based on the distance between points
    if (maxDiff > 10) return 4;
    if (maxDiff > 5) return 5;
    if (maxDiff > 2) return 6;
    if (maxDiff > 0.5) return 8;
    return 13;
  };
  
  const mapView = calculateMapView();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/')}
        sx={{ mb: 2 }}
        data-testid="back-button"
      >
        Back to Tracking
      </Button>
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom data-testid="delivery-status-title">
              Delivery Status
            </Typography>
            {courierData && (
              <MapContainer
                center={[mapView.center.lat, mapView.center.lng]}
                zoom={mapView.zoom}
                scrollWheelZoom={false}
                data-testid="delivery-map"
                style={{ height: '500px' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {startLocation && (
                  <Marker position={[startLocation.lat, startLocation.lng]} icon={restaurantIcon}>
                    <Popup>Start: {routeInfo.startAddress}</Popup>
                  </Marker>
                )}
                {currentLocation && (
                  <Marker position={[currentLocation.lat, currentLocation.lng]} icon={motorcycleIcon}>
                    <Popup>Current Location ({position?.progress ?? 0}% complete)</Popup>
                  </Marker>
                )}
                {endLocation && (
                  <Marker position={[endLocation.lat, endLocation.lng]} icon={houseIcon}>
                    <Popup>Destination: {routeInfo.endAddress}</Popup>
                  </Marker>
                )}
                {routeInfo?.waypoints && routeInfo.waypoints.length > 0 && (
                  <Polyline
                    positions={routeInfo.waypoints.flatMap(waypoint => 
                      waypoint.coordinates
                        .filter(coord => coord && coord.length >= 2)
                        .map(coord => [coord[1], coord[0]])
                    )}
                    color="blue"
                    weight={5}
                    opacity={0.6}
                  />
                )}
              </MapContainer>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Delivery Details
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography color="text.secondary">Courier ID</Typography>
                <Typography variant="body1" sx={{ mb: 2 }} data-testid="courier-id">
                  {courierData.id}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography color="text.secondary">Status</Typography>
                <Typography variant="body1" sx={{ mb: 2 }} data-testid="courier-status">
                  {courierData.status || 'In Transit'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography color="text.secondary">Driver</Typography>
                <Typography variant="body1" sx={{ mb: 2 }} data-testid="courier-driver">
                  {courierData.name} ({courierData.licensePlate})
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography color="text.secondary">Time Left</Typography>
                <Typography variant="body1" sx={{ mb: 2 }} data-testid="time-left">
                  {position?.timeLeft || 'Calculating...'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography color="text.secondary">Start Location</Typography>
                <Typography variant="body1" sx={{ mb: 2 }} data-testid="start-location">
                  {routeInfo?.startAddress || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography color="text.secondary">Destination</Typography>
                <Typography variant="body1" sx={{ mb: 2 }} data-testid="destination">
                  {routeInfo?.endAddress || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography color="text.secondary">Total Distance</Typography>
                <Typography variant="body1" sx={{ mb: 2 }} data-testid="total-distance">
                  {routeInfo?.totalDistance || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography color="text.secondary">Total Duration</Typography>
                <Typography variant="body1" sx={{ mb: 2 }} data-testid="total-duration">
                  {routeInfo?.totalDuration || 'N/A'}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

export default TrackingDetails; 