# Direct ePOS SDK Printing Integration

This document explains the direct Epson ePOS SDK integration for DonPaolo POS system.

## Overview

The system now uses the **Epson ePOS SDK JavaScript** library directly for printer control, enabling:
- Direct printer communication (no backend required for basic printing)
- Real-time printer status monitoring
- Cash drawer control
- Native printer commands (text formatting, cutting, etc.)

## Architecture

```
┌─────────────────┐
│  DonPaolo       │
│  Frontend       │
│  (React)        │
└────────┬────────┘
         │
         │ ePOS SDK JavaScript
         │ (Direct HTTP to printer)
         ▼
┌─────────────────┐
│  Epson Printer  │
│  (ePOS-Print)   │
│  Network IP     │
└─────────────────┘
```

## Components

### 1. ePOS Printer Service (`eposPrinterService.ts`)

**Location**: `frontend/src/services/eposPrinterService.ts`

**Features**:
- Loads ePOS SDK dynamically
- Manages printer connection/disconnection
- Provides direct printing methods
- Monitors printer status
- Handles cash drawer control

**Key Methods**:
- `connect(config)`: Connect to printer
- `disconnect()`: Disconnect from printer
- `isPrinterConnected()`: Check connection status
- `openCashDrawer()`: Open cash drawer
- `printReceiptText(lines, options)`: Print formatted text
- `onConnectionChange(callback)`: Subscribe to status changes

### 2. Printer Configuration Dialog

**Location**: `frontend/src/components/PrinterConfigDialog.tsx`

**Features**:
- Configure printer IP, port, and device ID
- Auto-discover printers on network
- Connect/disconnect to printer
- Real-time connection status
- Test printer connection

### 3. POS Page Integration

**Location**: `frontend/src/pages/POS.tsx`

**Features**:
- Automatic printer connection on print
- Direct ePOS printing with drawer control
- Fallback to image-based printing if ePOS fails
- Fallback to browser print if no printer configured

## Usage

### 1. Configure Printer

1. Open POS page
2. Click "Printer Settings" button
3. Enter printer IP address (e.g., `192.168.1.58`)
4. Enter port (usually `80` or `8008`)
5. Click "Discover" to auto-detect (optional)
6. Click "Connect to Printer"
7. Wait for connection confirmation

### 2. Print Receipt

1. Complete a sale in POS
2. Click "Print & Open Drawer"
3. System will:
   - Connect to printer (if not already connected)
   - Format receipt as text lines
   - Send to printer via ePOS SDK
   - Open cash drawer
   - Cut paper

### 3. Monitor Status

- Connection status shown in Printer Settings dialog
- Real-time status updates (online/offline, paper status, etc.)
- Error messages displayed in snackbar notifications

## Printer Configuration

### Required Settings

- **IP Address**: Network IP of Epson printer
- **Port**: Usually `80` (HTTP) or `8008` (ePOS-Print SDK default)
- **Device ID**: Usually `local_printer`

### Device Settings

- **Crypto**: `true` (encrypted communication)
- **Buffer**: `false` (immediate printing)

## Receipt Formatting

Receipts are formatted as text lines with:
- Header (store name, address)
- Receipt info (number, date)
- Customer info
- Items list
- Totals
- Footer

Formatting options:
- Text alignment (left, center, right)
- Font size (A, B, C, D, E)
- Double width/height
- Paper cutting
- Cash drawer control

## Printer Status Monitoring

The service monitors:
- **Connection status**: Online/Offline
- **Cover status**: Open/Closed
- **Paper status**: OK/Near End/End
- **Drawer status**: Open/Closed
- **Error states**: Mechanical errors, cutter errors, etc.

## Fallback Behavior

The system uses a three-tier fallback:

1. **Primary**: Direct ePOS SDK printing
   - Fastest, most reliable
   - Full printer control
   - Real-time status

2. **Secondary**: Image-based printing (via printer helper backend)
   - Works when ePOS SDK connection fails
   - Converts HTML to image
   - Sends via HTTP to printer

3. **Tertiary**: Browser print dialog
   - Works when no printer configured
   - Standard browser printing
   - User selects printer manually

## Error Handling

Common errors and solutions:

### Connection Failed
- **Cause**: Printer not reachable, wrong IP/port
- **Solution**: Verify IP address, check network, ensure ePOS-Print is enabled

### Device Creation Failed
- **Cause**: Device ID conflict, printer in use
- **Solution**: Check device ID, ensure printer is not in use by another app

### Print Failed
- **Cause**: Printer offline, paper out, cover open
- **Solution**: Check printer status, ensure paper loaded, close cover

## Files

- `frontend/src/services/eposPrinterService.ts` - ePOS SDK service
- `frontend/src/components/PrinterConfigDialog.tsx` - Configuration UI
- `frontend/src/pages/POS.tsx` - POS page with printing integration
- `frontend/public/epos-2.27.0.js` - Epson ePOS SDK library

## Benefits

1. **Direct Control**: No backend required for basic printing
2. **Real-time Status**: Monitor printer state in real-time
3. **Better Performance**: Faster printing, no image conversion overhead
4. **Native Features**: Access to all ePOS printer features
5. **Reliability**: Direct connection, fewer failure points

## Notes

- ePOS SDK must be loaded before use (handled automatically)
- Printer must support ePOS-Print service
- Network connectivity required between browser and printer
- Works best with Epson TM series printers
- For iPad/deployed use, ensure printer is on same network or use VPN


