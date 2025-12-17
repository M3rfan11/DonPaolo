import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Search as SearchIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import printerService, { DiscoveredPrinter } from '../services/printerService';
import eposPrinterService, { PrinterConfig as EposPrinterConfig } from '../services/eposPrinterService';

interface PrinterConfigDialogProps {
  open: boolean;
  onClose: () => void;
  onConfigSaved?: () => void;
}

const PrinterConfigDialog: React.FC<PrinterConfigDialogProps> = ({
  open,
  onClose,
  onConfigSaved,
}) => {
  const [printerIp, setPrinterIp] = useState('');
  const [printerPort, setPrinterPort] = useState('80');
  const [deviceId, setDeviceId] = useState('local_printer');
  const [discovering, setDiscovering] = useState(false);
  const [testing, setTesting] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [discoveredPrinters, setDiscoveredPrinters] = useState<DiscoveredPrinter[]>([]);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  // Use main API URL - printer endpoints are now in the main API
  const [helperUrl, setHelperUrl] = useState(
    process.env.REACT_APP_API_URL || process.env.REACT_APP_PRINTER_HELPER_URL || 'http://localhost:10000'
  );

  useEffect(() => {
    if (open) {
      // Load existing config from ePOS service (primary) or printer service (fallback)
      const eposConfig = eposPrinterService.getConfig();
      const config = eposConfig || printerService.loadConfig();
      
      if (config) {
        setPrinterIp(config.printerIp);
        setPrinterPort(config.printerPort.toString());
        setDeviceId(config.deviceId || 'local_printer');
      }
      
      // Check connection status
      setIsConnected(eposPrinterService.isPrinterConnected());
      
      setTestResult(null);
      setDiscoveredPrinters([]);

      // Subscribe to connection changes
      const unsubscribe = eposPrinterService.onConnectionChange((connected) => {
        setIsConnected(connected);
      });

      return () => unsubscribe();
    }
  }, [open]);

  const handleDiscover = async () => {
    if (!printerIp.trim()) {
      setTestResult({ success: false, message: 'Please enter a printer IP address' });
      return;
    }

    setDiscovering(true);
    setTestResult(null);
    setDiscoveredPrinters([]);

    try {
      const printers = await printerService.discoverPrinter(printerIp);
      setDiscoveredPrinters(printers);

      if (printers.length > 0) {
        const printer = printers[0];
        setPrinterIp(printer.ipAddress);
        setPrinterPort(printer.port.toString());
        setTestResult({
          success: true,
          message: `Found printer at ${printer.ipAddress}:${printer.port}`,
        });
      } else {
        setTestResult({
          success: false,
          message: 'No printer found at this IP address. Check the IP and ensure the printer is on the network.',
        });
      }
    } catch (error: any) {
      setTestResult({
        success: false,
        message: `Discovery failed: ${error.message || 'Unknown error'}`,
      });
    } finally {
      setDiscovering(false);
    }
  };

  const handleTest = async () => {
    if (!printerIp.trim() || !printerPort.trim()) {
      setTestResult({ success: false, message: 'Please enter printer IP and port' });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const success = await printerService.testConnection();
      if (success) {
        setTestResult({
          success: true,
          message: 'Connection test successful! Printer is reachable.',
        });
      } else {
        setTestResult({
          success: false,
          message: 'Connection test failed. Check IP, port, and network connection.',
        });
      }
    } catch (error: any) {
      setTestResult({
        success: false,
        message: `Test failed: ${error.message || 'Unknown error'}`,
      });
    } finally {
      setTesting(false);
    }
  };

  const handleConnect = async () => {
    if (!printerIp.trim() || !printerPort.trim()) {
      setTestResult({ success: false, message: 'Please enter printer IP and port' });
      return;
    }

    setConnecting(true);
    setTestResult(null);

    try {
      const config: EposPrinterConfig = {
        printerIp: printerIp.trim(),
        printerPort: parseInt(printerPort, 10) || 80,
        deviceId: deviceId.trim() || 'local_printer',
        crypto: true,
        buffer: false,
      };

      await eposPrinterService.connect(config);
      eposPrinterService.saveConfig(config);
      setIsConnected(true);
      setTestResult({
        success: true,
        message: 'Connected to printer successfully!',
      });

      if (onConfigSaved) {
        onConfigSaved();
      }
    } catch (error: any) {
      setTestResult({
        success: false,
        message: `Connection failed: ${error.message}`,
      });
      setIsConnected(false);
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = () => {
    eposPrinterService.disconnect();
    setIsConnected(false);
    setTestResult({
      success: true,
      message: 'Disconnected from printer',
    });
  };

  const handleSave = () => {
    if (!printerIp.trim() || !printerPort.trim()) {
      setTestResult({ success: false, message: 'Please enter printer IP and port' });
      return;
    }

    const config: EposPrinterConfig = {
      printerIp: printerIp.trim(),
      printerPort: parseInt(printerPort, 10) || 80,
      deviceId: deviceId.trim() || 'local_printer',
      crypto: true,
      buffer: false,
    };

    // Save to both services for compatibility
    eposPrinterService.saveConfig(config);
    printerService.saveConfig({
      printerIp: config.printerIp,
      printerPort: config.printerPort,
      deviceId: config.deviceId,
    });

    setTestResult({
      success: true,
      message: 'Printer configuration saved successfully!',
    });

    if (onConfigSaved) {
      onConfigSaved();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <SettingsIcon />
          <Typography variant="h6">Printer Configuration</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Alert severity="info" sx={{ mb: 3 }}>
            Configure your Epson ePOS-Print printer to enable printing from mobile devices and deployed environments.
            Printer functionality is integrated into the main API - no separate service needed!
          </Alert>

          <TextField
            fullWidth
            label="API URL"
            value={helperUrl}
            onChange={(e) => setHelperUrl(e.target.value)}
            helperText="Main API URL (printer endpoints are integrated)"
            sx={{ mb: 2 }}
            disabled
          />

          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
            <TextField
              fullWidth
              label="Printer IP Address"
              value={printerIp}
              onChange={(e) => setPrinterIp(e.target.value)}
              placeholder="192.168.1.58"
              helperText="IP address of your Epson printer"
              sx={{ flex: { xs: '1 1 auto', sm: '2 1 0%' } }}
            />
            <Box display="flex" gap={1} sx={{ flex: { xs: '1 1 auto', sm: '1 1 0%' } }}>
              <TextField
                fullWidth
                label="Port"
                value={printerPort}
                onChange={(e) => setPrinterPort(e.target.value)}
                placeholder="80"
                helperText="Usually 80 or 8008"
              />
              <Tooltip title="Discover printer on network">
                <IconButton
                  onClick={handleDiscover}
                  disabled={discovering || !printerIp.trim()}
                  color="primary"
                  sx={{ mt: 1 }}
                >
                  {discovering ? <CircularProgress size={20} /> : <SearchIcon />}
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          <TextField
            fullWidth
            label="Device ID"
            value={deviceId}
            onChange={(e) => setDeviceId(e.target.value)}
            helperText="Device ID for ePOS-Print (usually 'local_printer')"
            sx={{ mt: 2 }}
          />

          {discoveredPrinters.length > 0 && (
            <Alert severity="success" sx={{ mt: 2 }}>
              <Typography variant="body2" fontWeight="bold">
                Discovered Printers:
              </Typography>
              {discoveredPrinters.map((printer, idx) => (
                <Typography key={idx} variant="body2">
                  • {printer.ipAddress}:{printer.port} {printer.model ? `(${printer.model})` : ''}
                </Typography>
              ))}
            </Alert>
          )}

          {testResult && (
            <Alert
              severity={testResult.success ? 'success' : 'error'}
              sx={{ mt: 2 }}
              icon={testResult.success ? <CheckCircleIcon /> : <ErrorIcon />}
            >
              {testResult.message}
            </Alert>
          )}

          {/* Connection Status */}
          {isConnected && (
            <Alert severity="success" sx={{ mt: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="body2">✓ Connected to printer</Typography>
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  onClick={handleDisconnect}
                >
                  Disconnect
                </Button>
              </Box>
            </Alert>
          )}

          <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              onClick={handleTest}
              disabled={testing || !printerIp.trim() || !printerPort.trim()}
              startIcon={testing ? <CircularProgress size={16} /> : <CheckCircleIcon />}
            >
              Test Connection
            </Button>
            {!isConnected ? (
              <Button
                variant="contained"
                color="primary"
                onClick={handleConnect}
                disabled={connecting || !printerIp.trim() || !printerPort.trim()}
                startIcon={connecting ? <CircularProgress size={16} /> : <CheckCircleIcon />}
              >
                Connect to Printer
              </Button>
            ) : (
              <Button
                variant="outlined"
                color="error"
                onClick={handleDisconnect}
                startIcon={<ErrorIcon />}
              >
                Disconnect
              </Button>
            )}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={!printerIp.trim() || !printerPort.trim()}
        >
          Save Configuration
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PrinterConfigDialog;

