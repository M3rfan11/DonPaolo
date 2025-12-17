/**
 * Printer Service for DonPaolo
 * Handles communication with the printer helper backend for Epson ePOS-Print printers
 * Works with iPad and deployed environments via ngrok
 */

// Use main API URL instead of separate printer helper
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:10000';
const PRINTER_HELPER_URL = process.env.REACT_APP_PRINTER_HELPER_URL || API_BASE_URL;

export interface PrinterConfig {
  printerIp: string;
  printerPort: number;
  deviceId?: string;
}

export interface DiscoveredPrinter {
  ipAddress: string;
  port: number;
  model?: string;
}

class PrinterService {
  private config: PrinterConfig | null = null;

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
   * Save printer configuration to localStorage
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
   * Get current printer configuration
   */
  getConfig(): PrinterConfig | null {
    if (!this.config) {
      this.loadConfig();
    }
    return this.config;
  }

  /**
   * Discover printer on the network
   */
  async discoverPrinter(ip: string, subnetMask?: string, gateway?: string): Promise<DiscoveredPrinter[]> {
    try {
      const params = new URLSearchParams({ ip });
      if (subnetMask) params.append('subnetMask', subnetMask);
      if (gateway) params.append('gateway', gateway);

      // Use main API endpoint
      const response = await fetch(`${PRINTER_HELPER_URL}/api/Printer/discover?${params}`);
      if (!response.ok) {
        throw new Error(`Failed to discover printer: ${response.statusText}`);
      }

      const printers: DiscoveredPrinter[] = await response.json();
      return printers;
    } catch (error) {
      console.error('Error discovering printer:', error);
      throw error;
    }
  }

  /**
   * Convert HTML content to base64 image using html2canvas
   */
  private async htmlToImage(htmlContent: string, width: number = 300): Promise<string> {
    // Import html2canvas dynamically
    const html2canvas = (await import('html2canvas')).default;

    return new Promise((resolve, reject) => {
      // Create a temporary container to render the HTML
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.width = `${width}px`;
      container.style.backgroundColor = '#ffffff';
      container.style.padding = '10px';
      document.body.appendChild(container);

      // Create a temporary iframe to render the HTML with proper styling
      const iframe = document.createElement('iframe');
      iframe.style.width = `${width}px`;
      iframe.style.border = 'none';
      iframe.style.height = 'auto';
      container.appendChild(iframe);

      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) {
        document.body.removeChild(container);
        reject(new Error('Could not access iframe document'));
        return;
      }

      iframeDoc.open();
      iframeDoc.write(htmlContent);
      iframeDoc.close();

      // Wait for content to load and images to render
      iframe.onload = () => {
        setTimeout(() => {
          try {
            const body = iframeDoc.body;
            if (!body) {
              document.body.removeChild(container);
              reject(new Error('Could not access iframe body'));
              return;
            }

            // Use html2canvas to convert the iframe body to canvas
            html2canvas(body, {
              width: width,
              backgroundColor: '#ffffff',
              scale: 2,
              useCORS: true,
              logging: false,
            })
              .then((canvas: HTMLCanvasElement) => {
                const dataUrl = canvas.toDataURL('image/png');
                document.body.removeChild(container);
                resolve(dataUrl);
              })
              .catch((error: Error) => {
                document.body.removeChild(container);
                reject(error);
              });
          } catch (error) {
            document.body.removeChild(container);
            reject(error);
          }
        }, 500); // Wait for images and styles to load
      };
    });
  }

  /**
   * Print receipt by converting HTML to image and sending to printer
   */
  async printReceipt(htmlContent: string, openDrawer: boolean = false): Promise<void> {
    const config = this.getConfig();
    if (!config) {
      throw new Error('Printer not configured. Please configure printer settings first.');
    }

    try {
      // Convert HTML to image
      const imageDataUrl = await this.htmlToImage(htmlContent, 300);

      // Send to main API printer endpoint
      const params = new URLSearchParams({
        printerIp: config.printerIp,
        printerPort: config.printerPort.toString(),
        deviceId: config.deviceId || 'local_printer',
      });

      const response = await fetch(`${PRINTER_HELPER_URL}/api/Printer/print-images?${params}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          images: [imageDataUrl],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Print failed: ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Print successful:', result);

      // Open cash drawer if requested
      if (openDrawer) {
        try {
          // You can add cash drawer opening logic here if needed
          // This might require additional API endpoint in printer helper
        } catch (error) {
          console.warn('Failed to open cash drawer:', error);
        }
      }
    } catch (error) {
      console.error('Error printing receipt:', error);
      throw error;
    }
  }

  /**
   * Test printer connection
   */
  async testConnection(): Promise<boolean> {
    const config = this.getConfig();
    if (!config) {
      return false;
    }

    try {
      const printers = await this.discoverPrinter(config.printerIp);
      return printers.length > 0;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }
}

const printerService = new PrinterService();
// eslint-disable-next-line import/no-anonymous-default-export
export default printerService;

