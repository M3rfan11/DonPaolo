# Printer Integration Setup Guide

This guide explains how to set up the Epson ePOS-Print printer integration for DonPaolo POS system, enabling printing from iPad and deployed environments.

## Overview

The printer integration uses:
- **Printer Helper Backend** (.NET): A local service that communicates with Epson printers via HTTP
- **Printer Service** (Frontend): React service that converts receipts to images and sends them to the printer
- **ngrok** (Optional): For exposing the printer helper to deployed frontends

## Prerequisites

1. Epson ePOS-Print compatible printer (e.g., TM-T20II, TM-T88V)
2. Printer connected to the same network
3. .NET 9.0 SDK installed
4. Node.js and npm installed
5. ngrok (optional, for deployed environments)

## Setup Steps

### 1. Configure Printer Network Settings

1. Connect your Epson printer to your network
2. Note the printer's IP address (usually found in printer settings menu)
3. Ensure ePOS-Print service is enabled on the printer (usually on port 80 or 8008)

### 2. Start Printer Helper Backend

```bash
cd printer/printer-helper-dotnet
dotnet restore
dotnet run --launch-profile http
```

The backend will run on `http://localhost:5056`

### 3. Configure Frontend Environment

Create or update `.env` file in the `frontend` folder:

```env
REACT_APP_PRINTER_HELPER_URL=http://localhost:5056
```

For deployed environments with ngrok:
```env
REACT_APP_PRINTER_HELPER_URL=https://your-ngrok-url.ngrok-free.app
```

### 4. Configure Printer in DonPaolo

1. Open the DonPaolo POS page
2. Click "Printer Settings" button in the top right
3. Enter your printer's IP address
4. Enter the port (usually 80 or 8008)
5. Click "Discover" to auto-detect the printer
6. Click "Test Connection" to verify
7. Click "Save Configuration"

### 5. (Optional) Setup ngrok for Deployed Environments

When deploying the frontend (e.g., Vercel, Netlify), you need to expose the printer helper backend:

1. **Install ngrok**: https://ngrok.com/download
2. **Sign up** for a free account: https://dashboard.ngrok.com/signup
3. **Get authtoken**: https://dashboard.ngrok.com/get-started/your-authtoken
4. **Authenticate**:
   ```bash
   ngrok config add-authtoken YOUR_AUTHTOKEN
   ```
5. **Start ngrok tunnel**:
   ```bash
   ngrok http 5056
   ```
6. **Update frontend .env** with the ngrok URL:
   ```env
   REACT_APP_PRINTER_HELPER_URL=https://abc123.ngrok-free.app
   ```

## Usage

### Printing Receipts

1. Complete a sale in the POS system
2. Click "Print Receipt" in the receipt dialog
3. The system will:
   - Check if printer is configured
   - If configured: Convert receipt HTML to image and send to printer via printer helper
   - If not configured: Fall back to browser print dialog

### Printer Configuration

- **IP Address**: The network IP of your Epson printer
- **Port**: Usually 80 (HTTP) or 8008 (ePOS-Print SDK default)
- **Device ID**: Usually "local_printer" for ePOS-Print service

## Troubleshooting

### Printer Not Found

- Verify printer IP address is correct
- Check printer is on the same network
- Ensure ePOS-Print service is enabled on printer
- Try different ports (80, 8008, 8043, 9001)

### Connection Failed

- Verify printer helper backend is running
- Check firewall settings
- Verify network connectivity
- Check printer's network settings

### Print Not Working on iPad

- Ensure printer helper URL is accessible from iPad's network
- Use ngrok for deployed environments
- Check CORS settings in printer helper backend
- Verify printer configuration is saved

### Images Not Printing

- Check printer supports image printing
- Verify receipt HTML is rendering correctly
- Check browser console for errors
- Ensure html2canvas library is installed

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  DonPaolo       │    │  Printer Helper  │    │  Epson Printer  │
│  Frontend       │───►│  Backend (.NET)  │───►│  (ePOS-Print)   │
│  (React)        │    │  (localhost:5056)│    │  (Network IP)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
        │                       │
        │                       │
        ▼                       ▼
  Receipt HTML          HTTP POST to
  → Image (html2canvas)  /cgi-bin/epos/service.cgi
```

## Files

- `frontend/src/services/printerService.ts` - Printer service for frontend
- `frontend/src/components/PrinterConfigDialog.tsx` - Printer configuration UI
- `frontend/src/pages/POS.tsx` - Updated POS page with printer integration
- `printer/printer-helper-dotnet/Program.cs` - Printer helper backend
- `printer/ePOS_SDK_JavaScript_v2.27.0g/` - Epson ePOS SDK (reference)

## Notes

- The printer helper must be running on a machine that can access the printer's network
- For iPad/tablet use, consider running the printer helper on a server or using ngrok
- The system falls back to browser print if printer is not configured
- Receipts are converted to images (PNG) before sending to printer

