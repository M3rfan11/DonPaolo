using Microsoft.AspNetCore.Mvc;
using System.Net.Http;
using System.Text;
using System.Text.Json;

namespace Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PrinterController : ControllerBase
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<PrinterController> _logger;

    public PrinterController(ILogger<PrinterController> logger)
    {
        _logger = logger;
        _httpClient = new HttpClient
        {
            Timeout = TimeSpan.FromSeconds(1)
        };
    }

    /// <summary>
    /// Discover printer on the network by testing specific IP address
    /// GET /api/Printer/discover?ip=192.168.1.58
    /// </summary>
    [HttpGet("discover")]
    public async Task<IActionResult> DiscoverPrinter([FromQuery] string ip, [FromQuery] string? subnetMask = null, [FromQuery] string? gateway = null)
    {
        if (string.IsNullOrEmpty(ip))
        {
            return BadRequest(new { error = "IP address is required (e.g., ?ip=192.168.1.58)" });
        }

        if (!System.Net.IPAddress.TryParse(ip, out _))
        {
            return BadRequest(new { error = "Invalid IP address format." });
        }

        _logger.LogInformation("Testing printer IP: {Ip}", ip);

        var portsToTry = new[] { 8008, 80, 8043, 9001 }; // Common ePOS-Print ports
        var discoveredPrinters = new List<object>();

        foreach (var port in portsToTry)
        {
            try
            {
                var serviceUrl = $"http://{ip}:{port}/cgi-bin/epos/service.cgi?devid=local_printer&timeout=1000&printmode=0";
                var serviceResponse = await _httpClient.GetAsync(serviceUrl);

                // 200, 400, or 401 suggests ePOS-Print service exists
                if (serviceResponse.IsSuccessStatusCode ||
                    (int)serviceResponse.StatusCode == 400 ||
                    (int)serviceResponse.StatusCode == 401)
                {
                    _logger.LogInformation("Found ePOS-Print service at {Ip}:{Port}", ip, port);
                    discoveredPrinters.Add(new
                    {
                        ipAddress = ip,
                        port = port,
                        model = "Epson ePOS-Print"
                    });
                    break; // Return first working port
                }

                // Also try root HTTP endpoint
                var rootUrl = $"http://{ip}:{port}/";
                var rootResponse = await _httpClient.GetAsync(rootUrl);

                if (rootResponse.IsSuccessStatusCode)
                {
                    var content = await rootResponse.Content.ReadAsStringAsync();
                    var headers = rootResponse.Headers.ToString();

                    if (content.Contains("EPSON", StringComparison.OrdinalIgnoreCase) ||
                        content.Contains("TM-T", StringComparison.OrdinalIgnoreCase) ||
                        content.Contains("ePOS-Print", StringComparison.OrdinalIgnoreCase) ||
                        headers.Contains("EPSON", StringComparison.OrdinalIgnoreCase) ||
                        headers.Contains("ePOS", StringComparison.OrdinalIgnoreCase))
                    {
                        _logger.LogInformation("Found potential Epson device at {Ip}:{Port}", ip, port);
                        discoveredPrinters.Add(new
                        {
                            ipAddress = ip,
                            port = port,
                            model = "Epson device"
                        });
                        break;
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogDebug("Port {Port} test failed: {Error}", port, ex.Message);
                // Continue to next port
            }
        }

        return Ok(discoveredPrinters);
    }

    /// <summary>
    /// Print images to Epson ePOS-Print printer
    /// POST /api/Printer/print-images?printerIp=192.168.1.58&printerPort=80&deviceId=local_printer
    /// Body: { "images": ["data:image/png;base64,..."] }
    /// </summary>
    [HttpPost("print-images")]
    public async Task<IActionResult> PrintImages(
        [FromQuery] string printerIp,
        [FromQuery] string printerPort,
        [FromQuery] string? deviceId = "local_printer",
        [FromBody] PrintImagesRequest? request = null)
    {
        try
        {
            // Validate printer IP
            if (string.IsNullOrWhiteSpace(printerIp))
            {
                return BadRequest(new { error = "printerIp parameter is required" });
            }

            // Validate and set port default
            if (string.IsNullOrWhiteSpace(printerPort) || !int.TryParse(printerPort, out var portNum) || portNum <= 0 || portNum > 65535)
            {
                _logger.LogWarning("Invalid port '{Port}', defaulting to 80", printerPort);
                printerPort = "80";
            }

            // Validate IP format
            if (!System.Net.IPAddress.TryParse(printerIp, out _) && 
                !System.Uri.CheckHostName(printerIp).Equals(System.UriHostNameType.Dns))
            {
                return BadRequest(new { error = $"Invalid printer IP address format: '{printerIp}'" });
            }

            if (request == null || request.Images == null || request.Images.Length == 0)
            {
                return BadRequest(new { error = "Request body must contain 'images' array with base64 image strings." });
            }

            _logger.LogInformation("Printing {Count} images to {Ip}:{Port}", request.Images.Length, printerIp, printerPort);

            var eposClient = new HttpClient
            {
                Timeout = TimeSpan.FromSeconds(30)
            };

            var baseUrl = $"http://{printerIp}:{printerPort}";
            var eposUrl = $"{baseUrl}/cgi-bin/epos/service.cgi";
            var errors = new List<string>();

            // Process each image
            foreach (var imageDataUrl in request.Images)
            {
                if (string.IsNullOrEmpty(imageDataUrl))
                    continue;

                try
                {
                    // Extract base64 data from data URL
                    var base64Image = imageDataUrl.Contains(",")
                        ? imageDataUrl.Split(',')[1]
                        : imageDataUrl;

                    // Decode base64 to get image dimensions
                    var imageBytes = Convert.FromBase64String(base64Image);
                    
                    // Thermal printer width (80mm = ~300px at 180dpi)
                    const int thermalWidth = 300;
                    
                    // Estimate image height based on data size
                    // Rough estimation: height = (dataSize / width) * aspectRatio
                    var estimatedHeight = Math.Max(500, (int)(imageBytes.Length / thermalWidth * 0.4));
                    var imageHeight = estimatedHeight;

                    // Send image to Epson ePOS-Print service via HTTP POST
                    var eposPayload = new
                    {
                        method = "printImage",
                        @params = new[]
                        {
                            new
                            {
                                devid = deviceId ?? "local_printer",
                                timeout = 10000,
                                printmode = "0",
                                image = base64Image,
                                x = 0,
                                y = 0,
                                width = thermalWidth,
                                height = imageHeight
                            }
                        },
                        id = Guid.NewGuid().ToString()
                    };

                    var jsonPayload = JsonSerializer.Serialize(eposPayload);
                    var content = new StringContent(jsonPayload, Encoding.UTF8, "application/json");

                    var response = await eposClient.PostAsync(eposUrl, content);

                    if (!response.IsSuccessStatusCode)
                    {
                        var errorText = await response.Content.ReadAsStringAsync();
                        _logger.LogError("Print failed: {StatusCode} - {Error}", response.StatusCode, errorText);
                        errors.Add($"Failed to send image: {response.StatusCode} - {errorText}");
                    }
                    else
                    {
                        _logger.LogInformation("Image printed successfully");
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error processing image");
                    errors.Add($"Error processing image: {ex.Message}");
                }
            }

            if (errors.Count > 0)
            {
                return StatusCode(500, new
                {
                    message = "Some images failed to print",
                    errors = errors,
                    printerIp,
                    printerPort,
                    deviceId
                });
            }

            return Ok(new
            {
                message = $"Images printed successfully to {printerIp}:{printerPort}",
                pages = request.Images.Length,
                printerIp,
                printerPort,
                deviceId
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error printing images");
            return StatusCode(500, new { error = $"Error printing images: {ex.Message}" });
        }
    }

    public class PrintImagesRequest
    {
        public string[] Images { get; set; } = Array.Empty<string>();
    }
}

