/**
 * Epson ePOS SDK Printer Service
 * Direct printer control using ePOS SDK JavaScript library
 */

// Declare ePOS SDK types
declare global {
  interface Window {
    epson: {
      ePOSDevice: new () => EPOSDevice;
    };
  }
}

interface EPOSDevice {
  DEVICE_TYPE_PRINTER: number;
  createDevice(
    deviceId: string,
    deviceType: number,
    options: { crypto: boolean; buffer: boolean },
    callback: (device: any, code: string) => void
  ): void;
  connect(ipAddress: string, port: string | number, callback: (result: string) => void): void;
  disconnect(): void;
}

interface PrinterDevice {
  addTextAlign(align: number): void;
  addText(text: string): void;
  addTextLang(lang: string): void;
  addTextFont(font: number): void;
  addTextSize(width: number, height: number): void;
  addTextStyle(reverse: boolean, ul: boolean, em: boolean, color: number): void;
  addTextDouble(dw: boolean, dh: boolean): void;
  addFeedLine(lines: number): void;
  addFeedUnit(unit: number): void;
  addImage(
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    color: number,
    mode: number
  ): void;
  addPulse(drawer: number, pulse: number): void;
  addCut(cut: number): void;
  send(): void;
  onreceive: (response: PrinterResponse) => void;
  ononline: () => void;
  onoffline: () => void;
  onpoweroff: () => void;
  oncoverok: () => void;
  oncoveropen: () => void;
  onpaperok: () => void;
  onpapernearend: () => void;
  onpaperend: () => void;
  ondrawerclosed: () => void;
  ondraweropen: () => void;
  ALIGN_LEFT: number;
  ALIGN_CENTER: number;
  ALIGN_RIGHT: number;
  COLOR_1: number;
  COLOR_2: number;
  MODE_MONO: number;
  MODE_GRAY16: number;
  DRAWER_1: number;
  DRAWER_2: number;
  PULSE_100: number;
  PULSE_200: number;
  PULSE_500: number;
  CUT_FEED: number;
  CUT_NO_FEED: number;
  CUT_RESERVE: number;
  FONT_A: number;
  FONT_B: number;
  FONT_C: number;
  FONT_D: number;
  FONT_E: number;
}

interface PrinterResponse {
  success: boolean;
  code: string;
  status: number;
}

export interface PrinterConfig {
  printerIp: string;
  printerPort: number;
  deviceId?: string;
  crypto?: boolean;
  buffer?: boolean;
}

class EposPrinterService {
  private eposDevice: EPOSDevice | null = null;
  private printerDevice: PrinterDevice | null = null;
  private config: PrinterConfig | null = null;
  private isConnected: boolean = false;
  private connectionCallbacks: Array<(connected: boolean) => void> = [];

  /**
   * Load ePOS SDK script
   */
  async loadSDK(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.epson && window.epson.ePOSDevice) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = '/epos-2.27.0.js';
      script.onload = () => {
        if (window.epson && window.epson.ePOSDevice) {
          resolve();
        } else {
          reject(new Error('ePOS SDK failed to load'));
        }
      };
      script.onerror = () => reject(new Error('Failed to load ePOS SDK script'));
      document.head.appendChild(script);
    });
  }

  /**
   * Load printer configuration from localStorage
   */
  loadConfig(): PrinterConfig | null {
    try {
      const saved = localStorage.getItem('printerConfig');
      if (saved) {
        this.config = JSON.parse(saved);
        return this.config;
      }
    } catch (error) {
      console.error('Error loading printer config:', error);
    }
    return null;
  }

  /**
   * Save printer configuration
   */
  saveConfig(config: PrinterConfig): void {
    try {
      localStorage.setItem('printerConfig', JSON.stringify(config));
      this.config = config;
    } catch (error) {
      console.error('Error saving printer config:', error);
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): PrinterConfig | null {
    if (!this.config) {
      this.loadConfig();
    }
    return this.config;
  }

  /**
   * Connect to printer
   */
  async connect(config?: PrinterConfig): Promise<boolean> {
    const printerConfig = config || this.getConfig();
    if (!printerConfig) {
      throw new Error('Printer not configured');
    }

    try {
      // Load SDK if not loaded
      await this.loadSDK();

      // Create ePOS device
      this.eposDevice = new window.epson.ePOSDevice();

      return new Promise((resolve, reject) => {
        // Connect to printer
        this.eposDevice!.connect(
          printerConfig.printerIp,
          printerConfig.printerPort.toString(),
          (result: string) => {
            if (result === 'OK') {
              // Create printer device
              this.eposDevice!.createDevice(
                printerConfig.deviceId || 'local_printer',
                this.eposDevice!.DEVICE_TYPE_PRINTER,
                {
                  crypto: printerConfig.crypto ?? true,
                  buffer: printerConfig.buffer ?? false,
                },
                (device: PrinterDevice, code: string) => {
                  if (code === 'OK') {
                    this.printerDevice = device;
                    this.setupPrinterCallbacks();
                    this.isConnected = true;
                    this.config = printerConfig;
                    this.notifyConnectionChange(true);
                    resolve(true);
                  } else {
                    this.isConnected = false;
                    this.notifyConnectionChange(false);
                    reject(new Error(`Failed to create device: ${code}`));
                  }
                }
              );
            } else {
              this.isConnected = false;
              this.notifyConnectionChange(false);
              reject(new Error(`Failed to connect: ${result}`));
            }
          }
        );
      });
    } catch (error: any) {
      this.isConnected = false;
      this.notifyConnectionChange(false);
      throw error;
    }
  }

  /**
   * Setup printer event callbacks
   */
  private setupPrinterCallbacks(): void {
    if (!this.printerDevice) return;

    this.printerDevice.onreceive = (response: PrinterResponse) => {
      console.log('Print response:', response);
      if (!response.success) {
        console.error('Print failed:', response.code, response.status);
      }
    };

    this.printerDevice.ononline = () => {
      console.log('Printer online');
      this.isConnected = true;
      this.notifyConnectionChange(true);
    };

    this.printerDevice.onoffline = () => {
      console.log('Printer offline');
      this.isConnected = false;
      this.notifyConnectionChange(false);
    };

    this.printerDevice.oncoveropen = () => {
      console.warn('Printer cover is open');
    };

    this.printerDevice.onpaperend = () => {
      console.warn('Printer paper end');
    };

    this.printerDevice.ondraweropen = () => {
      console.log('Cash drawer opened');
    };

    this.printerDevice.ondrawerclosed = () => {
      console.log('Cash drawer closed');
    };
  }

  /**
   * Disconnect from printer
   */
  disconnect(): void {
    if (this.eposDevice) {
      this.eposDevice.disconnect();
      this.eposDevice = null;
      this.printerDevice = null;
      this.isConnected = false;
      this.notifyConnectionChange(false);
    }
  }

  /**
   * Check if connected
   */
  isPrinterConnected(): boolean {
    return this.isConnected && this.printerDevice !== null;
  }

  /**
   * Subscribe to connection status changes
   */
  onConnectionChange(callback: (connected: boolean) => void): () => void {
    this.connectionCallbacks.push(callback);
    return () => {
      this.connectionCallbacks = this.connectionCallbacks.filter((cb) => cb !== callback);
    };
  }

  /**
   * Notify connection status change
   */
  private notifyConnectionChange(connected: boolean): void {
    this.connectionCallbacks.forEach((callback) => callback(connected));
  }

  /**
   * Open cash drawer
   */
  openCashDrawer(drawer: number = 1, pulse: number = 100): void {
    if (!this.printerDevice) {
      throw new Error('Printer not connected');
    }

    const drawerPin = drawer === 1 ? this.printerDevice.DRAWER_1 : this.printerDevice.DRAWER_2;
    const pulseTime =
      pulse === 100
        ? this.printerDevice.PULSE_100
        : pulse === 200
        ? this.printerDevice.PULSE_200
        : this.printerDevice.PULSE_500;

    this.printerDevice.addPulse(drawerPin, pulseTime);
    this.printerDevice.send();
  }

  /**
   * Print receipt text
   */
  printReceiptText(
    lines: string[],
    options: {
      align?: 'left' | 'center' | 'right';
      font?: 'A' | 'B' | 'C' | 'D' | 'E';
      doubleWidth?: boolean;
      doubleHeight?: boolean;
      openDrawer?: boolean;
      cutPaper?: boolean;
    } = {}
  ): void {
    if (!this.printerDevice) {
      throw new Error('Printer not connected');
    }

    // Store reference to avoid null checks in callbacks
    const printer = this.printerDevice;

    // Set alignment
    const align =
      options.align === 'center'
        ? printer.ALIGN_CENTER
        : options.align === 'right'
        ? printer.ALIGN_RIGHT
        : printer.ALIGN_LEFT;
    printer.addTextAlign(align);

    // Set font
    if (options.font) {
      const fontMap: Record<string, number> = {
        A: printer.FONT_A,
        B: printer.FONT_B,
        C: printer.FONT_C,
        D: printer.FONT_D,
        E: printer.FONT_E,
      };
      printer.addTextFont(fontMap[options.font] || printer.FONT_A);
    }

    // Set double size
    if (options.doubleWidth || options.doubleHeight) {
      printer.addTextDouble(
        options.doubleWidth || false,
        options.doubleHeight || false
      );
    }

    // Print lines
    lines.forEach((line) => {
      printer.addText(line);
      printer.addFeedLine(1);
    });

    // Open drawer if requested
    if (options.openDrawer) {
      printer.addPulse(printer.DRAWER_1, printer.PULSE_100);
    }

    // Cut paper if requested
    if (options.cutPaper) {
      printer.addCut(printer.CUT_FEED);
    } else {
      printer.addFeedLine(3);
    }

    // Send to printer
    printer.send();
  }

  /**
   * Print receipt from HTML content (converts to text)
   */
  async printReceiptFromHTML(
    htmlContent: string,
    options: {
      openDrawer?: boolean;
      cutPaper?: boolean;
    } = {}
  ): Promise<void> {
    if (!this.printerDevice) {
      throw new Error('Printer not connected');
    }

    // Create temporary element to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;

    // Extract text content and format
    const textContent = tempDiv.textContent || tempDiv.innerText || '';
    const lines = textContent
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    // Print with formatting
    this.printReceiptText(lines, {
      align: 'left',
      font: 'A',
      openDrawer: options.openDrawer,
      cutPaper: options.cutPaper,
    });
  }
}

export default new EposPrinterService();

