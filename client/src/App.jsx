import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import TrackingForm from './pages/TrackingForm';
import TrackingDetails from './pages/TrackingDetails';
import './styles/global.css';

const theme = createTheme({
  typography: {
    fontFamily: '"Poppins", "Montserrat", sans-serif',
  },
  palette: {
    primary: {
      main: '#2196f3',
    },
    secondary: {
      main: '#f50057',
    },
    background: {
      default: '#f5f5f5',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/" element={<TrackingForm />} />
          <Route path="/tracking/:courierId" element={<TrackingDetails />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App; 