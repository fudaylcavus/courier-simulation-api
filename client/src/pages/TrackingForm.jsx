import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Paper,
} from '@mui/material';
import MopedIcon from '@mui/icons-material/Moped';

function TrackingForm() {
  const [courierId, setCourierId] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (courierId.trim()) {
      navigate(`/tracking/${courierId}`);
    }
  };

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
            sx={{ fontSize: 48, color: 'primary.main', mb: 2 }}
          />
          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            sx={{ fontWeight: 600 }}
          >
            Track Your Order
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ mb: 4 }}
          >
            Enter your courier ID to track your delivery in real-time
          </Typography>
          <form onSubmit={handleSubmit} data-testid="tracking-form">
            <TextField
              fullWidth
              label="Courier ID"
              variant="outlined"
              value={courierId}
              onChange={(e) => setCourierId(e.target.value)}
              sx={{ mb: 2 }}
              data-testid="courier-id-input"
              id="courier-id-input"
            />
            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              sx={{
                height: 48,
                textTransform: 'none',
                fontSize: '1.1rem',
              }}
              data-testid="track-button"
              id="track-button"
            >
              Track Now
            </Button>
          </form>
        </Paper>
      </Box>
    </Container>
  );
}

export default TrackingForm; 