/*
 * HeartWise ECG Monitor - ESP32 ALL-IN-ONE Version
 * ================================================
 * Runs WiFi, Bluetooth LE, and USB Serial SIMULTANEOUSLY
 * No mode switching needed - connect via any method!
 * 
 * AUTO-CONFIG: On first boot, creates "HeartWise-Setup" WiFi hotspot.
 * Connect to it, open 192.168.4.1 in browser, enter WiFi + server details.
 * Settings are saved to flash and persist across reboots.
 * Hold BOOT button (GPIO0) during startup to reset saved config.
 * 
 * Hardware Connections:
 * - AD8232 OUTPUT -> ESP32 GPIO34 (A6)
 * - AD8232 LO-    -> ESP32 GPIO2
 * - AD8232 LO+    -> ESP32 GPIO4
 * - AD8232 3.3V   -> ESP32 3.3V
 * - AD8232 GND    -> ESP32 GND
 * 
 * Connection Methods (ALL ACTIVE):
 * 1. WiFi: Auto-connects to server, best for home use
 * 2. BLE: Direct phone/computer connection, no router needed
 * 3. USB: Always outputs data, use USB Bridge or Web Serial
 * 
 * Libraries Required:
 * - WebSockets by Markus Sattler
 * - ArduinoJson by Benoit Blanchon
 * (BLE + Preferences + WebServer are built into ESP32 Arduino core)
 */

#include <WiFi.h>
#include <WebServer.h>
#include <Preferences.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include <WiFiUdp.h>
#include <DNSServer.h>

// ============== CONFIGURATION ==============
// Default fallback values (used only if nothing is stored in flash)
#define DEFAULT_SERVER_PORT 5001

// Device Settings
const char* DEVICE_NAME = "HeartWise-ECG";
const char* FIRMWARE_VERSION = "4.0.0-AIO";

// Config AP Settings
const char* AP_SSID = "HeartWise-Setup";
const char* AP_PASSWORD = "heartwise";  // Min 8 chars for WPA2

// Reset button (BOOT button on most ESP32 dev boards)
const int RESET_CONFIG_PIN = 0;  // GPIO0 = BOOT button

// BLE UUIDs
#define SERVICE_UUID        "12345678-1234-5678-1234-56789abcdef0"
#define ECG_CHAR_UUID       "12345678-1234-5678-1234-56789abcdef1"
#define CONTROL_CHAR_UUID   "12345678-1234-5678-1234-56789abcdef2"
#define DEVICE_INFO_UUID    "12345678-1234-5678-1234-56789abcdef3"

// Pin Definitions
const int ECG_PIN = 34;      // AD8232 OUTPUT pin
const int LO_MINUS_PIN = 2;  // AD8232 LO- pin
const int LO_PLUS_PIN = 4;   // AD8232 LO+ pin
const int LED_PIN = 13;      // Use GPIO13 for LED (not GPIO2 which is LO-)

// ECG Sampling
const int SAMPLE_RATE = 250;
const int SAMPLE_INTERVAL_US = 4000; // 4ms = 250Hz
const int BATCH_SIZE = 25;
const float VOLTAGE_REF = 3.3;
const int ADC_MAX = 4095;

// ============== GLOBAL VARIABLES ==============
// Stored config (loaded from Preferences/flash)
String storedSSID = "";
String storedPassword = "";
String storedServerIP = "";
int storedServerPort = DEFAULT_SERVER_PORT;

String deviceId;
String sessionId = "";
bool isRecording = false;

// Connection States
bool wifiConnected = false;
bool bleClientConnected = false;
bool configMode = false;  // true = AP config portal active

// WiFi
WebSocketsClient webSocket;
bool wsConnected = false;

// Config Portal
WebServer configServer(80);
DNSServer dnsServer;
Preferences preferences;

// BLE
BLEServer* pServer = NULL;
BLECharacteristic* pECGCharacteristic = NULL;
BLECharacteristic* pControlCharacteristic = NULL;
BLECharacteristic* pDeviceInfoCharacteristic = NULL;

// Timing
unsigned long lastSampleTime = 0;
unsigned long lastHeartbeat = 0;
unsigned long lastWiFiCheck = 0;
unsigned long lastStatusPrint = 0;

// Data Buffer
struct ECGPoint {
  unsigned long timestamp;
  float voltage;
  float quality;
  bool leadsOff;
};

ECGPoint dataBuffer[BATCH_SIZE];
int bufferIndex = 0;

const char CONFIG_PAGE[] PROGMEM = R"rawliteral(
<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>HeartWise Setup</title></head>
<body style="font-family:sans-serif;padding:20px;">
<h2>HeartWise ECG Setup</h2>
<form action="/save" method="POST">
  <p><b>WiFi Network (SSID)</b><br><input type="text" name="ssid" required></p>
  <p><b>WiFi Password</b><br><input type="password" name="password"></p>
  <p><b>Server IP Address</b><br><input type="text" name="server_ip" placeholder="e.g. 192.168.1.100" required></p>
  <p><b>Server Port</b><br><input type="number" name="server_port" value="5001" required></p>
  <p><button type="submit" style="padding:10px;background:#007BFF;color:white;border:none;border-radius:5px;">Save & Connect</button></p>
</form>
</body></html>
)rawliteral";

// ============== BLE CALLBACKS ==============
class ServerCallbacks: public BLEServerCallbacks {
  void onConnect(BLEServer* pServer) {
    bleClientConnected = true;
    Serial.println("📱 BLE Client Connected!");
  }

  void onDisconnect(BLEServer* pServer) {
    bleClientConnected = false;
    Serial.println("📱 BLE Client Disconnected");
    delay(100);
    BLEDevice::startAdvertising();
  }
};

// Forward declaration
void handleCommand(String command, String source);

class ControlCallbacks: public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic *pCharacteristic) {
    String value = pCharacteristic->getValue().c_str();
    if (value.length() > 0) {
      handleCommand(value, "BLE");
    }
  }
};

// ============== PREFERENCES HELPERS ==============
void loadConfig() {
  preferences.begin("heartwise", true);  // read-only
  storedSSID = preferences.getString("ssid", "");
  storedPassword = preferences.getString("password", "");
  storedServerIP = preferences.getString("serverIP", "");
  storedServerPort = preferences.getInt("serverPort", DEFAULT_SERVER_PORT);
  preferences.end();
  
  Serial.println("📋 Loaded config from flash:");
  Serial.printf("   SSID: %s\n", storedSSID.length() > 0 ? storedSSID.c_str() : "(empty)");
  Serial.printf("   Server: %s:%d\n", 
    storedServerIP.length() > 0 ? storedServerIP.c_str() : "(empty)", 
    storedServerPort);
}

void saveConfig(String ssid, String password, String serverIP, int serverPort) {
  preferences.begin("heartwise", false);  // read-write
  preferences.putString("ssid", ssid);
  preferences.putString("password", password);
  preferences.putString("serverIP", serverIP);
  preferences.putInt("serverPort", serverPort);
  preferences.end();
  
  // Update global variables
  storedSSID = ssid;
  storedPassword = password;
  storedServerIP = serverIP;
  storedServerPort = serverPort;
  
  Serial.println("💾 Config saved to flash!");
}

void clearConfig() {
  preferences.begin("heartwise", false);
  preferences.clear();
  preferences.end();
  
  storedSSID = "";
  storedPassword = "";
  storedServerIP = "";
  storedServerPort = DEFAULT_SERVER_PORT;
  
  Serial.println("🗑️ All config cleared from flash!");
}

bool hasStoredConfig() {
  return storedSSID.length() > 0 && storedServerIP.length() > 0;
}

// ============== SETUP ==============
void setup() {
  Serial.begin(115200);
  delay(1000);
  
  printBanner();
  
  // Initialize pins
  pinMode(ECG_PIN, INPUT);
  pinMode(LO_MINUS_PIN, INPUT);
  pinMode(LO_PLUS_PIN, INPUT);
  pinMode(LED_PIN, OUTPUT);
  pinMode(RESET_CONFIG_PIN, INPUT_PULLUP);
  
  // Generate device ID from MAC
  uint8_t mac[6];
  WiFi.macAddress(mac);
  deviceId = String(DEVICE_NAME) + "-" + 
             String(mac[4], HEX) + String(mac[5], HEX);
  deviceId.toUpperCase();
  
  Serial.println("📟 Device ID: " + deviceId);
  Serial.println();
  
  // Load saved config from flash
  loadConfig();
  
  // CHECK: Hold BOOT button during startup to reset config
  delay(100);
  if (digitalRead(RESET_CONFIG_PIN) == LOW) {
    Serial.println("🔘 BOOT button held — clearing saved config...");
    blinkLED(5, 100);
    clearConfig();
  }
  
  // Decide: connect to stored WiFi or start config portal
  if (hasStoredConfig() || storedSSID.length() > 0) { // allow connecting if only SSID is present
    Serial.println("📶 Trying stored WiFi credentials...");
    if (connectToWiFi()) {
      // WiFi connected — try to discover server dynamically
      discoverServer();
      setupWebSocket();
    } else {
      // WiFi failed — start config portal
      Serial.println("❌ Could not connect to stored WiFi. Starting config portal...");
      startConfigPortal();
    }
  } else {
    Serial.println("⚙️ No config found. Starting setup portal...");
    startConfigPortal();
  }
  
  // Always set up BLE and USB regardless of WiFi state
  if (!configMode) {
    setupBLE();
  }
  setupUSB();
  
  Serial.println("\n✅ ALL SYSTEMS READY!");
  Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  if (configMode) {
    Serial.println("MODE: CONFIG PORTAL");
    Serial.printf("Connect to WiFi: \"%s\" (password: %s)\n", AP_SSID, AP_PASSWORD);
    Serial.println("Then open http://192.168.4.1 in your browser");
  } else {
    Serial.println("MODE: NORMAL — WiFi | Bluetooth | USB Serial");
  }
  Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  
  blinkLED(3, 200);
}

// ============== MAIN LOOP ==============
void loop() {
  // CONFIG MODE: serve the web portal
  if (configMode) {
    configServer.handleClient();
    
    // Blink LED slowly to indicate config mode
    static unsigned long lastBlink = 0;
    if (millis() - lastBlink > 1000) {
      digitalWrite(LED_PIN, !digitalRead(LED_PIN));
      lastBlink = millis();
    }
    
    // Check for USB serial commands even in config mode
    handleUSBSerial();
    return;
  }
  
  // NORMAL MODE
  // Handle WiFi WebSocket
  if (wifiConnected) {
    webSocket.loop();
  }
  
  // Check WiFi periodically
  if (millis() - lastWiFiCheck > 10000) {
    checkWiFi();
    lastWiFiCheck = millis();
  }
  
  // Handle USB Serial commands
  handleUSBSerial();
  
  // Send heartbeat (WiFi)
  if (wsConnected && millis() - lastHeartbeat > 30000) {
    sendHeartbeat();
    lastHeartbeat = millis();
  }
  
  // Sample ECG at precise intervals
  if (isRecording) {
    unsigned long now = micros();
    if (now - lastSampleTime >= SAMPLE_INTERVAL_US) {
      sampleECG();
      lastSampleTime = now;
    }
  }
  
  // Send batch when full
  if (bufferIndex >= BATCH_SIZE) {
    sendDataBatch();
  }
  
  // Print status every 10 seconds
  if (millis() - lastStatusPrint > 10000) {
    printStatus();
    lastStatusPrint = millis();
  }
}

// ============== WiFi CONNECTION ==============
bool connectToWiFi() {
  Serial.println("📶 Connecting to WiFi...");
  
  WiFi.mode(WIFI_STA);
  WiFi.begin(storedSSID.c_str(), storedPassword.c_str());
  
  Serial.print("   Network: ");
  Serial.println(storedSSID);
  
  // Wait up to 15 seconds
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  Serial.println();
  
  if (WiFi.status() == WL_CONNECTED) {
    wifiConnected = true;
    Serial.println("   ✓ WiFi Connected!");
    Serial.print("   IP: ");
    Serial.println(WiFi.localIP());
    return true;
  } else {
    Serial.println("   ✗ WiFi connection failed");
    return false;
  }
}

void setupWebSocket() {
  Serial.printf("🔌 Connecting WebSocket to %s:%d...\n", 
    storedServerIP.c_str(), storedServerPort);
  
  webSocket.begin(storedServerIP.c_str(), storedServerPort, "/ws/esp32");
  webSocket.onEvent(webSocketEvent);
  webSocket.setReconnectInterval(5000);
}

void checkWiFi() {
  if (WiFi.status() != WL_CONNECTED && wifiConnected) {
    wifiConnected = false;
    wsConnected = false;
    Serial.println("📶 WiFi disconnected, trying to reconnect...");
    WiFi.reconnect();
  } else if (WiFi.status() == WL_CONNECTED && !wifiConnected) {
    wifiConnected = true;
    Serial.println("📶 WiFi reconnected!");
    discoverServer(); // Re-discover server in case IP changed
    setupWebSocket();
  }
}

// ============== UDP AUTO-DISCOVERY ==============
void discoverServer() {
  WiFiUDP udp;
  udp.begin(5003); // Random local port
  
  Serial.println("🔍 Searching for HeartWise Backend automatically via UDP Broadcast...");
  
  // Try 8 times to find the laptop
  for(int i = 0; i < 8; i++) {
    IPAddress broadcastIp = WiFi.broadcastIP();
    udp.beginPacket(broadcastIp, 5002);
    udp.print("HEARTWISE_DISCOVER");
    udp.endPacket();
    
    // Wait for reply for 1 second
    unsigned long start = millis();
    while(millis() - start < 1000) {
      int packetSize = udp.parsePacket();
      if (packetSize) {
        char buf[64];
        int len = udp.read(buf, 63);
        buf[len] = 0;
        if (strncmp(buf, "HEARTWISE_SERVER", 16) == 0) {
          String foundIp = udp.remoteIP().toString();
          storedServerIP = foundIp; // Update dynamically
          Serial.println("✅ Found server! Live Backend IP is: " + foundIp);
          return; // Success
        }
      }
      delay(10);
    }
  }
  Serial.println("⚠️ Could not discover server dynamically. Falling back to stored IP: " + storedServerIP);
}

void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
  switch(type) {
    case WStype_DISCONNECTED:
      wsConnected = false;
      Serial.println("🔌 WebSocket disconnected");
      break;
      
    case WStype_CONNECTED:
      wsConnected = true;
      Serial.println("🔌 WebSocket connected!");
      registerDevice();
      break;
      
    case WStype_TEXT:
      handleCommand(String((char*)payload), "WiFi");
      break;
      
    case WStype_ERROR:
      Serial.println("🔌 WebSocket error");
      break;
  }
}

// ============== CONFIG PORTAL ==============
void startConfigPortal() {
  configMode = true;
  
  // Use AP+STA so we can scan for networks while serving the portal
  WiFi.mode(WIFI_AP_STA);
  WiFi.softAP(AP_SSID, AP_PASSWORD);
  delay(500);  // Give AP time to start
  
  Serial.println("📡 Access Point started:");
  Serial.printf("   SSID: %s\n", AP_SSID);
  Serial.printf("   Password: %s\n", AP_PASSWORD);
  Serial.printf("   IP: %s\n", WiFi.softAPIP().toString().c_str());
  
  // Serve config page
  configServer.on("/", HTTP_GET, handleConfigPage);
  configServer.on("/config", HTTP_GET, handleGetConfig);
  configServer.on("/scan", HTTP_GET, handleScanNetworks);
  configServer.on("/save", HTTP_POST, handleSaveConfig);
  configServer.onNotFound(handleConfigPage);
  
  configServer.begin();
  Serial.println("🌐 Config portal ready at http://192.168.4.1");
  
  // Start async scan AFTER server is running
  delay(200);
  WiFi.scanNetworks(true);
}

void handleConfigPage() {
  configServer.send_P(200, "text/html", CONFIG_PAGE);
}

void handleGetConfig() {
  StaticJsonDocument<256> doc;
  doc["ssid"] = storedSSID;
  doc["server_ip"] = storedServerIP;
  doc["server_port"] = storedServerPort;
  doc["device_id"] = deviceId;
  
  String output;
  serializeJson(doc, output);
  configServer.send(200, "application/json", output);
}

void handleScanNetworks() {
  int n = WiFi.scanComplete();
  
  if (n == WIFI_SCAN_RUNNING) {
    configServer.send(200, "application/json", "[]");
    return;
  }
  
  if (n == WIFI_SCAN_FAILED) {
    WiFi.scanNetworks(true);  // Restart scan
    configServer.send(200, "application/json", "[]");
    return;
  }
  
  // Build sorted unique network list
  DynamicJsonDocument doc(2048);
  JsonArray networks = doc.to<JsonArray>();
  
  for (int i = 0; i < n && i < 15; i++) {
    // Skip duplicates
    bool duplicate = false;
    for (int j = 0; j < i; j++) {
      if (WiFi.SSID(i) == WiFi.SSID(j)) { duplicate = true; break; }
    }
    if (duplicate || WiFi.SSID(i).length() == 0) continue;
    
    JsonObject net = networks.createNestedObject();
    net["ssid"] = WiFi.SSID(i);
    net["rssi"] = WiFi.RSSI(i);
    net["secure"] = WiFi.encryptionType(i) != WIFI_AUTH_OPEN;
  }
  
  String output;
  serializeJson(doc, output);
  configServer.send(200, "application/json", output);
  
  // Start new scan for next request
  WiFi.scanDelete();
  WiFi.scanNetworks(true);
}

void handleSaveConfig() {
  String ssid = configServer.arg("ssid");
  String password = configServer.arg("password");
  String serverIP = configServer.arg("server_ip");
  int serverPort = configServer.arg("server_port").toInt();
  
  if (ssid.length() == 0 || serverIP.length() == 0) {
    configServer.send(400, "application/json", 
      "{\"error\":\"SSID and Server IP are required\"}");
    return;
  }
  
  if (serverPort <= 0 || serverPort > 65535) {
    serverPort = DEFAULT_SERVER_PORT;
  }
  
  Serial.println("💾 Saving new configuration:");
  Serial.printf("   SSID: %s\n", ssid.c_str());
  Serial.printf("   Server: %s:%d\n", serverIP.c_str(), serverPort);
  
  // Save to flash
  saveConfig(ssid, password, serverIP, serverPort);
  
  // Send simple text response
  configServer.send(200, "text/plain", "Config saved! Please wait 3 seconds for ESP32 to restart...");
  
  // Give the response time to send
  delay(3000);
  
  // Restart ESP32 to apply new config
  Serial.println("🔄 Restarting with new config...");
  ESP.restart();
}

// ============== BLE SETUP ==============
void setupBLE() {
  Serial.println("📱 Setting up Bluetooth LE...");
  
  BLEDevice::init(deviceId.c_str());
  
  // Create server
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new ServerCallbacks());
  
  // Create service
  BLEService *pService = pServer->createService(SERVICE_UUID);
  
  // ECG Data Characteristic (Notify)
  pECGCharacteristic = pService->createCharacteristic(
    ECG_CHAR_UUID,
    BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY
  );
  pECGCharacteristic->addDescriptor(new BLE2902());
  
  // Control Characteristic (Write)
  pControlCharacteristic = pService->createCharacteristic(
    CONTROL_CHAR_UUID,
    BLECharacteristic::PROPERTY_WRITE | BLECharacteristic::PROPERTY_WRITE_NR
  );
  pControlCharacteristic->setCallbacks(new ControlCallbacks());
  
  // Device Info Characteristic (Read)
  pDeviceInfoCharacteristic = pService->createCharacteristic(
    DEVICE_INFO_UUID,
    BLECharacteristic::PROPERTY_READ
  );
  
  // Set device info JSON
  StaticJsonDocument<256> infoDoc;
  infoDoc["deviceId"] = deviceId;
  infoDoc["firmware"] = FIRMWARE_VERSION;
  infoDoc["sampleRate"] = SAMPLE_RATE;
  infoDoc["mode"] = "ALL-IN-ONE";
  String infoStr;
  serializeJson(infoDoc, infoStr);
  pDeviceInfoCharacteristic->setValue(infoStr.c_str());
  
  // Start service and advertising
  pService->start();
  
  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(true);
  pAdvertising->setMinPreferred(0x06);
  BLEDevice::startAdvertising();
  
  Serial.println("   ✓ BLE Ready - Advertising as: " + deviceId);
}

// ============== USB SERIAL SETUP ==============
void setupUSB() {
  Serial.println("🔌 USB Serial ready at 115200 baud");
  Serial.println("   Commands: START, STOP, STATUS, INFO, RESET, CONFIG");
}

void handleUSBSerial() {
  if (Serial.available()) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();
    
    if (cmd.length() > 0) {
      // Special commands for config management
      String upperCmd = cmd;
      upperCmd.toUpperCase();
      
      if (upperCmd == "RESET") {
        Serial.println("🗑️ Clearing config and entering setup mode...");
        clearConfig();
        delay(1000);
        ESP.restart();
        return;
      }
      
      if (upperCmd == "CONFIG") {
        Serial.println("📋 Current Configuration:");
        Serial.printf("   WiFi SSID: %s\n", storedSSID.c_str());
        Serial.printf("   Server IP: %s\n", storedServerIP.c_str());
        Serial.printf("   Server Port: %d\n", storedServerPort);
        Serial.printf("   Config Mode: %s\n", configMode ? "YES" : "NO");
        Serial.printf("   WiFi Connected: %s\n", wifiConnected ? "YES" : "NO");
        Serial.printf("   WebSocket: %s\n", wsConnected ? "Connected" : "Disconnected");
        return;
      }
      
      // Handle SET commands: SET SSID mynetwork, SET IP 192.168.1.5, SET PORT 5001
      if (upperCmd.startsWith("SET ")) {
        handleSetCommand(cmd.substring(4));
        return;
      }
      
      handleCommand(cmd, "USB");
    }
  }
}

void handleSetCommand(String args) {
  String upperArgs = args;
  upperArgs.toUpperCase();
  
  if (upperArgs.startsWith("SSID ")) {
    String value = args.substring(5);
    value.trim();
    preferences.begin("heartwise", false);
    preferences.putString("ssid", value);
    preferences.end();
    storedSSID = value;
    Serial.printf("✅ WiFi SSID set to: %s\n", value.c_str());
    Serial.println("   Type REBOOT to apply changes");
  }
  else if (upperArgs.startsWith("PASS ")) {
    String value = args.substring(5);
    value.trim();
    preferences.begin("heartwise", false);
    preferences.putString("password", value);
    preferences.end();
    storedPassword = value;
    Serial.println("✅ WiFi password updated");
    Serial.println("   Type REBOOT to apply changes");
  }
  else if (upperArgs.startsWith("IP ")) {
    String value = args.substring(3);
    value.trim();
    preferences.begin("heartwise", false);
    preferences.putString("serverIP", value);
    preferences.end();
    storedServerIP = value;
    Serial.printf("✅ Server IP set to: %s\n", value.c_str());
    Serial.println("   Type REBOOT to apply changes");
  }
  else if (upperArgs.startsWith("PORT ")) {
    int value = args.substring(5).toInt();
    if (value > 0 && value <= 65535) {
      preferences.begin("heartwise", false);
      preferences.putInt("serverPort", value);
      preferences.end();
      storedServerPort = value;
      Serial.printf("✅ Server port set to: %d\n", value);
      Serial.println("   Type REBOOT to apply changes");
    } else {
      Serial.println("❌ Invalid port number");
    }
  }
  else {
    Serial.println("Usage: SET SSID <name> | SET PASS <password> | SET IP <address> | SET PORT <port>");
  }
}

// ============== COMMAND HANDLING ==============
void handleCommand(String payload, String source) {
  Serial.printf("📥 [%s] Command: %s\n", source.c_str(), payload.c_str());
  
  // Simple text commands
  String upperPayload = payload;
  upperPayload.toUpperCase();
  
  if (upperPayload == "START") {
    startRecording("manual-" + String(millis()));
    sendResponse("{\"status\":\"recording\",\"sessionId\":\"" + sessionId + "\"}", source);
    return;
  }
  
  if (upperPayload == "STOP") {
    stopRecording();
    sendResponse("{\"status\":\"stopped\"}", source);
    return;
  }
  
  if (upperPayload == "STATUS") {
    sendStatusResponse(source);
    return;
  }
  
  if (upperPayload == "INFO") {
    sendInfoResponse(source);
    return;
  }
  
  if (upperPayload == "REBOOT") {
    Serial.println("🔄 Rebooting...");
    delay(500);
    ESP.restart();
    return;
  }
  
  // JSON commands
  if (payload.startsWith("{")) {
    StaticJsonDocument<512> doc;
    DeserializationError error = deserializeJson(doc, payload);
    
    if (error) {
      Serial.println("   JSON parse error");
      return;
    }
    
    const char* event = doc["event"] | "";
    const char* type = doc["type"] | "";
    const char* cmd = doc["cmd"] | "";
    
    // Handle start recording
    if (strcmp(event, "start-recording") == 0 || 
        strcmp(type, "start-recording") == 0 ||
        strcmp(cmd, "start") == 0) {
      const char* sessId = doc["sessionId"] | "";
      String sid = strlen(sessId) > 0 ? String(sessId) : ("session-" + String(millis()));
      startRecording(sid);
      return;
    }
    
    // Handle stop recording
    if (strcmp(event, "stop-recording") == 0 || 
        strcmp(type, "stop-recording") == 0 ||
        strcmp(cmd, "stop") == 0) {
      stopRecording();
      return;
    }
  }
}

void sendResponse(String response, String source) {
  if (source == "USB" || source == "ALL") {
    Serial.println(response);
  }
}

void sendStatusResponse(String source) {
  StaticJsonDocument<256> doc;
  doc["type"] = "status";
  doc["recording"] = isRecording;
  doc["sessionId"] = sessionId;
  doc["wifi"] = wifiConnected && wsConnected;
  doc["ble"] = bleClientConnected;
  doc["bufferUsed"] = bufferIndex;
  doc["uptime"] = millis() / 1000;
  doc["serverIP"] = storedServerIP;
  doc["serverPort"] = storedServerPort;
  
  String output;
  serializeJson(doc, output);
  sendResponse(output, source);
}

void sendInfoResponse(String source) {
  StaticJsonDocument<512> doc;
  doc["type"] = "device-info";
  doc["deviceId"] = deviceId;
  doc["firmware"] = FIRMWARE_VERSION;
  doc["mode"] = "ALL-IN-ONE";
  doc["sampleRate"] = SAMPLE_RATE;
  doc["batchSize"] = BATCH_SIZE;
  doc["config"]["ssid"] = storedSSID;
  doc["config"]["serverIP"] = storedServerIP;
  doc["config"]["serverPort"] = storedServerPort;
  doc["connections"]["wifi"] = wifiConnected;
  doc["connections"]["wsConnected"] = wsConnected;
  doc["connections"]["ble"] = bleClientConnected;
  doc["connections"]["usb"] = true;
  
  String output;
  serializeJson(doc, output);
  sendResponse(output, source);
}

// ============== RECORDING CONTROL ==============
void startRecording(String sid) {
  sessionId = sid;
  isRecording = true;
  bufferIndex = 0;
  lastSampleTime = micros();
  
  Serial.println("▶️ Recording Started - Session: " + sessionId);
  blinkLED(2, 100);
}

void stopRecording() {
  isRecording = false;
  
  // Send any remaining data
  if (bufferIndex > 0) {
    sendDataBatch();
  }
  
  Serial.println("⏹️ Recording Stopped");
  sessionId = "";
  blinkLED(1, 500);
}

// ============== ECG SAMPLING ==============
void sampleECG() {
  // Read ECG
  int rawValue = analogRead(ECG_PIN);
  float voltage = (rawValue / (float)ADC_MAX) * VOLTAGE_REF;
  float voltageMV = (voltage - (VOLTAGE_REF / 2.0)) * 1000.0;
  
  // Debug: Print raw ADC value every second
  static unsigned long lastDebug = 0;
  if (millis() - lastDebug > 1000) {
    Serial.printf("DEBUG: GPIO%d raw=%d voltage=%.2fmV\n", ECG_PIN, rawValue, voltageMV);
    lastDebug = millis();
  }
  
  // Check leads-off detection
  bool loMinus = digitalRead(LO_MINUS_PIN);
  bool loPlus = digitalRead(LO_PLUS_PIN);
  bool leadsOff = (loMinus == HIGH || loPlus == HIGH);
  
  // Calculate quality based on signal variance
  float quality = leadsOff ? 0.0 : calculateQuality(voltageMV);
  
  // Store in buffer
  dataBuffer[bufferIndex].timestamp = millis();
  dataBuffer[bufferIndex].voltage = voltageMV;
  dataBuffer[bufferIndex].quality = quality;
  dataBuffer[bufferIndex].leadsOff = leadsOff;
  
  bufferIndex++;
  
  // LED feedback
  static int sampleCount = 0;
  if (++sampleCount >= 125) { // Toggle every 0.5 sec
    digitalWrite(LED_PIN, !digitalRead(LED_PIN));
    sampleCount = 0;
  }
}

float calculateQuality(float voltage) {
  float absV = abs(voltage);
  if (absV < 0.1) return 20.0;
  if (absV > 2.0) return 30.0;
  return min(100.0f, 50.0f + absV * 25.0f);
}

// ============== DATA TRANSMISSION ==============
void sendDataBatch() {
  if (bufferIndex == 0) return;
  
  // Build JSON
  StaticJsonDocument<4096> doc;
  doc["type"] = "ecg-data";
  doc["sessionId"] = sessionId;
  doc["deviceId"] = deviceId;
  
  JsonArray dataArray = doc.createNestedArray("data");
  
  for (int i = 0; i < bufferIndex; i++) {
    JsonObject point = dataArray.createNestedObject();
    point["timestamp"] = dataBuffer[i].timestamp;
    point["voltage"] = round(dataBuffer[i].voltage * 100) / 100.0;
    point["quality"] = (int)dataBuffer[i].quality;
    point["leadsOff"] = dataBuffer[i].leadsOff;
  }
  
  String output;
  serializeJson(doc, output);
  
  // Send to ALL connected channels
  
  // 1. WiFi WebSocket
  if (wsConnected) {
    webSocket.sendTXT(output);
  }
  
  // 2. BLE Notification
  if (bleClientConnected) {
    const int BLE_BATCH_SIZE = 10;
    
    for (int start = 0; start < bufferIndex; start += BLE_BATCH_SIZE) {
      int end = min(start + BLE_BATCH_SIZE, bufferIndex);
      
      StaticJsonDocument<256> bleDoc;
      bleDoc["sid"] = sessionId.substring(0, 8);
      JsonArray bleData = bleDoc.createNestedArray("d");
      
      for (int i = start; i < end; i++) {
        JsonObject p = bleData.createNestedObject();
        p["t"] = dataBuffer[i].timestamp;
        p["v"] = (int)(dataBuffer[i].voltage * 10);
        p["q"] = (int)dataBuffer[i].quality;
      }
      
      String bleOutput;
      serializeJson(bleDoc, bleOutput);
      
      pECGCharacteristic->setValue(bleOutput.c_str());
      pECGCharacteristic->notify();
      delay(5);
    }
  }
  
  // 3. USB Serial (always)
  Serial.println(output);
  
  bufferIndex = 0;
}

// ============== DEVICE REGISTRATION ==============
void registerDevice() {
  StaticJsonDocument<256> doc;
  doc["type"] = "register";
  doc["deviceId"] = deviceId;
  doc["deviceName"] = DEVICE_NAME;
  doc["firmwareVersion"] = FIRMWARE_VERSION;
  doc["sampleRate"] = SAMPLE_RATE;
  doc["mode"] = "ALL-IN-ONE";
  
  String output;
  serializeJson(doc, output);
  webSocket.sendTXT(output);
  
  Serial.println("📤 Device registered with server");
}

void sendHeartbeat() {
  StaticJsonDocument<128> doc;
  doc["type"] = "heartbeat";
  doc["deviceId"] = deviceId;
  doc["recording"] = isRecording;
  
  String output;
  serializeJson(doc, output);
  webSocket.sendTXT(output);
}

// ============== UTILITIES ==============
void printBanner() {
  Serial.println();
  Serial.println("╔═══════════════════════════════════════════════╗");
  Serial.println("║   HeartWise ECG Monitor - ALL-IN-ONE v4.0     ║");
  Serial.println("║   WiFi + Bluetooth LE + USB Serial            ║");
  Serial.println("║   Auto-Config with Captive Portal             ║");
  Serial.println("╚═══════════════════════════════════════════════╝");
  Serial.println();
}

void printStatus() {
  Serial.println("─────────────────────────────────────────────────");
  Serial.printf("📊 Status: %s\n", isRecording ? "RECORDING" : "IDLE");
  Serial.printf("   WiFi: %s (%s) | WebSocket: %s\n", 
    wifiConnected ? "✓" : "✗", 
    storedSSID.c_str(),
    wsConnected ? "✓" : "✗");
  Serial.printf("   Server: %s:%d\n", storedServerIP.c_str(), storedServerPort);
  Serial.printf("   BLE: %s | USB: ✓ (always on)\n", 
    bleClientConnected ? "✓ Connected" : "○ Advertising");
  if (isRecording) {
    Serial.printf("   Session: %s\n", sessionId.c_str());
  }
  Serial.println("─────────────────────────────────────────────────");
}

void blinkLED(int times, int delayMs) {
  for (int i = 0; i < times; i++) {
    digitalWrite(LED_PIN, HIGH);
    delay(delayMs);
    digitalWrite(LED_PIN, LOW);
    delay(delayMs);
  }
}
