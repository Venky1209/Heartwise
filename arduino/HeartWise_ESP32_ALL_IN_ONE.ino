/*
 * HeartWise ECG Monitor - ESP32 ALL-IN-ONE Version
 * ================================================
 * Runs WiFi, Bluetooth LE, and USB Serial SIMULTANEOUSLY
 * No mode switching needed - connect via any method!
 * 
 * Hardware Connections:
 * - AD8232 OUTPUT -> ESP32 GPIO36 (VP/A0)
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
 * (BLE library is built into ESP32 Arduino core)
 */

#include <WiFi.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

// ============== CONFIGURATION ==============
// WiFi Settings
const char* WIFI_SSID = "csec";
const char* WIFI_PASSWORD = "paarivel";
const char* SERVER_IP = "192.168.81.52";
const int SERVER_PORT = 5001;

// Device Settings
const char* DEVICE_NAME = "HeartWise-ECG";
const char* FIRMWARE_VERSION = "3.0.0-AIO";

// BLE UUIDs
#define SERVICE_UUID        "12345678-1234-5678-1234-56789abcdef0"
#define ECG_CHAR_UUID       "12345678-1234-5678-1234-56789abcdef1"
#define CONTROL_CHAR_UUID   "12345678-1234-5678-1234-56789abcdef2"
#define DEVICE_INFO_UUID    "12345678-1234-5678-1234-56789abcdef3"

// Pin Definitions
const int ECG_PIN = 36;
const int LO_MINUS_PIN = 2;
const int LO_PLUS_PIN = 4;
const int LED_PIN = 2;

// ECG Sampling
const int SAMPLE_RATE = 250;
const int SAMPLE_INTERVAL_US = 4000; // 4ms = 250Hz
const int BATCH_SIZE = 25;
const float VOLTAGE_REF = 3.3;
const int ADC_MAX = 4095;

// ============== GLOBAL VARIABLES ==============
String deviceId;
String sessionId = "";
bool isRecording = false;

// Connection States
bool wifiConnected = false;
bool bleClientConnected = false;

// WiFi
WebSocketsClient webSocket;
bool wsConnected = false;

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

// ============== BLE CALLBACKS ==============
class ServerCallbacks: public BLEServerCallbacks {
  void onConnect(BLEServer* pServer) {
    bleClientConnected = true;
    Serial.println("📱 BLE Client Connected!");
    // Don't stop advertising - allow multiple connections to be attempted
    // BLEDevice::startAdvertising(); // Keep advertising for reconnection
  }

  void onDisconnect(BLEServer* pServer) {
    bleClientConnected = false;
    Serial.println("📱 BLE Client Disconnected");
    // Restart advertising
    delay(100);
    BLEDevice::startAdvertising();
  }
};

class ControlCallbacks: public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic *pCharacteristic) {
    std::string value = pCharacteristic->getValue();
    if (value.length() > 0) {
      handleCommand(String(value.c_str()), "BLE");
    }
  }
};

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
  
  // Generate device ID from MAC
  uint8_t mac[6];
  WiFi.macAddress(mac);
  deviceId = String(DEVICE_NAME) + "-" + 
             String(mac[4], HEX) + String(mac[5], HEX);
  deviceId.toUpperCase();
  
  Serial.println("📟 Device ID: " + deviceId);
  Serial.println();
  
  // Initialize all connection methods
  setupWiFi();
  setupBLE();
  setupUSB();
  
  Serial.println("\n✅ ALL SYSTEMS READY!");
  Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  Serial.println("Connect via: WiFi | Bluetooth | USB Serial");
  Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  
  blinkLED(3, 200);
}

// ============== MAIN LOOP ==============
void loop() {
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

// ============== WiFi SETUP ==============
void setupWiFi() {
  Serial.println("📶 Setting up WiFi...");
  
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  Serial.print("   Connecting to: ");
  Serial.println(WIFI_SSID);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    wifiConnected = true;
    Serial.println("\n   ✓ WiFi Connected!");
    Serial.print("   IP: ");
    Serial.println(WiFi.localIP());
    
    // Setup WebSocket
    webSocket.begin(SERVER_IP, SERVER_PORT, "/ws/esp32");
    webSocket.onEvent(webSocketEvent);
    webSocket.setReconnectInterval(5000);
  } else {
    Serial.println("\n   ⚠ WiFi not available (BLE & USB still work)");
  }
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
  }
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
  Serial.println("   Commands: START, STOP, STATUS, INFO");
}

void handleUSBSerial() {
  if (Serial.available()) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();
    
    if (cmd.length() > 0) {
      handleCommand(cmd, "USB");
    }
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
      String sid = doc["sessionId"] | ("session-" + String(millis()));
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
  // BLE responses are sent via characteristics
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
  
  // Check leads-off
  bool loMinus = digitalRead(LO_MINUS_PIN);
  bool loPlus = digitalRead(LO_PLUS_PIN);
  bool leadsOff = (loMinus == HIGH || loPlus == HIGH);
  
  // Calculate quality
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
    // BLE has MTU limits, send compact version
    StaticJsonDocument<512> bleDoc;
    bleDoc["sid"] = sessionId.substring(0, 8);
    JsonArray bleData = bleDoc.createNestedArray("d");
    
    for (int i = 0; i < bufferIndex; i++) {
      JsonObject p = bleData.createNestedObject();
      p["t"] = dataBuffer[i].timestamp;
      p["v"] = (int)(dataBuffer[i].voltage * 10); // Compact: 1 decimal as int
      p["q"] = (int)dataBuffer[i].quality;
    }
    
    String bleOutput;
    serializeJson(bleDoc, bleOutput);
    
    pECGCharacteristic->setValue(bleOutput.c_str());
    pECGCharacteristic->notify();
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
  Serial.println("║   HeartWise ECG Monitor - ALL-IN-ONE          ║");
  Serial.println("║   WiFi + Bluetooth LE + USB Serial            ║");
  Serial.println("║   Version 3.0.0                               ║");
  Serial.println("╚═══════════════════════════════════════════════╝");
  Serial.println();
}

void printStatus() {
  Serial.println("─────────────────────────────────────────────────");
  Serial.printf("📊 Status: %s\n", isRecording ? "RECORDING" : "IDLE");
  Serial.printf("   WiFi: %s | WebSocket: %s\n", 
    wifiConnected ? "✓" : "✗", 
    wsConnected ? "✓" : "✗");
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
