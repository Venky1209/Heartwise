/*
 * HeartWise ECG Monitor - ESP32 Multi-Mode Version
 * Supports: WiFi, Bluetooth Low Energy (BLE), and USB Serial
 * 
 * Hardware Connections:
 * - AD8232 OUTPUT -> ESP32 GPIO36 (VP/A0)
 * - AD8232 LO-    -> ESP32 GPIO2
 * - AD8232 LO+    -> ESP32 GPIO4
 * - AD8232 3.3V   -> ESP32 3.3V
 * - AD8232 GND    -> ESP32 GND
 * 
 * Connection Modes:
 * 1. WiFi Mode: Connects to WiFi router, streams to server
 * 2. BLE Mode: Direct connection to phone/computer via Bluetooth
 * 3. USB Serial Mode: Direct USB cable connection to computer
 * 
 * Mode Selection:
 * - Hold GPIO0 (BOOT button) during startup for 3 seconds to cycle modes
 * - Or set CONNECTION_MODE below
 */

#include <WiFi.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include <Preferences.h>

// ====== CONNECTION MODE ======
// 0 = WiFi (default), 1 = BLE, 2 = USB Serial
#define CONNECTION_MODE 2

// ====== WIFI CONFIGURATION ======
const char* WIFI_SSID = "csec";
const char* WIFI_PASSWORD = "paarivel";
const char* SERVER_IP = "192.168.81.52";
const int SERVER_PORT = 5001;

// ====== BLE CONFIGURATION ======
#define SERVICE_UUID        "12345678-1234-5678-1234-56789abcdef0"
#define ECG_CHAR_UUID       "12345678-1234-5678-1234-56789abcdef1"
#define CONTROL_CHAR_UUID   "12345678-1234-5678-1234-56789abcdef2"
#define DEVICE_INFO_UUID    "12345678-1234-5678-1234-56789abcdef3"

// ====== USB SERIAL CONFIGURATION ======
#define USB_BAUD_RATE 115200
#define USB_DATA_FORMAT "JSON"  // "JSON" or "CSV"

// ====== DEVICE CONFIGURATION ======
const char* DEVICE_NAME = "HeartWise-ESP32";

// ====== PIN DEFINITIONS ======
const int ECG_PIN = 34;
const int LO_MINUS_PIN = 2;
const int LO_PLUS_PIN = 4;
const int LED_PIN = 13;      // Use GPIO13 for LED (not GPIO2 which is LO-)
const int MODE_BUTTON_PIN = 0;  // BOOT button

// ====== ECG SAMPLING ======
const int SAMPLE_RATE = 250;
const int SAMPLE_INTERVAL = 1000 / SAMPLE_RATE;
const int BATCH_SIZE = 25;
const float VOLTAGE_REF = 3.3;
const int ADC_MAX = 4095;

// ====== GLOBAL VARIABLES ======
int connectionMode = CONNECTION_MODE;
String deviceId;
String sessionId = "";
bool isConnected = false;
bool isRecording = false;
unsigned long lastSampleTime = 0;
unsigned long lastHeartbeat = 0;
Preferences preferences;

// WiFi variables
WebSocketsClient webSocket;

// BLE variables
BLEServer* pServer = NULL;
BLECharacteristic* pECGCharacteristic = NULL;
BLECharacteristic* pControlCharacteristic = NULL;
BLECharacteristic* pDeviceInfoCharacteristic = NULL;
bool bleDeviceConnected = false;
bool oldBleDeviceConnected = false;

// Data Buffer
struct ECGData {
  unsigned long timestamp;
  float voltage;
  bool leadsOff;
  float quality;
};

ECGData dataBuffer[BATCH_SIZE];
int bufferIndex = 0;

// ====== BLE CALLBACKS ======
class ServerCallbacks: public BLEServerCallbacks {
  void onConnect(BLEServer* pServer) {
    bleDeviceConnected = true;
    isConnected = true;
    Serial.println("📱 BLE Client Connected!");
    digitalWrite(LED_PIN, HIGH);
  }

  void onDisconnect(BLEServer* pServer) {
    bleDeviceConnected = false;
    isConnected = false;
    isRecording = false;
    Serial.println("📱 BLE Client Disconnected!");
    digitalWrite(LED_PIN, LOW);
    // Restart advertising
    pServer->startAdvertising();
  }
};

class ControlCallbacks: public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic *pCharacteristic) {
    String value = String(pCharacteristic->getValue().c_str());
    if (value.length() > 0) {
      Serial.print("📥 BLE Command: ");
      Serial.println(value.c_str());
      
      DynamicJsonDocument doc(256);
      DeserializationError error = deserializeJson(doc, value.c_str());
      
      if (!error) {
        const char* cmd = doc["cmd"] | "";
        
        if (strcmp(cmd, "start") == 0) {
          sessionId = doc["sessionId"] | "ble-session";
          isRecording = true;
          bufferIndex = 0;
          Serial.println("▶ BLE Recording Started");
        }
        else if (strcmp(cmd, "stop") == 0) {
          isRecording = false;
          Serial.println("■ BLE Recording Stopped");
        }
      }
    }
  }
};

// ====== SETUP ======
void setup() {
  Serial.begin(USB_BAUD_RATE);
  delay(2000);
  
  printBanner();
  
  // Initialize pins
  pinMode(LO_MINUS_PIN, INPUT);
  pinMode(LO_PLUS_PIN, INPUT);
  pinMode(ECG_PIN, INPUT);
  pinMode(LED_PIN, OUTPUT);
  pinMode(MODE_BUTTON_PIN, INPUT_PULLUP);
  
  // Generate device ID
  uint8_t mac[6];
  WiFi.macAddress(mac);
  deviceId = String(DEVICE_NAME) + "-" + 
             String(mac[3], HEX) + String(mac[4], HEX) + String(mac[5], HEX);
  deviceId.toUpperCase();
  
  // Load saved mode
  preferences.begin("heartwise", false);
  connectionMode = preferences.getInt("mode", CONNECTION_MODE);
  
  // Check for mode change button
  checkModeButton();
  
  Serial.println("Device ID: " + deviceId);
  Serial.print("Connection Mode: ");
  
  // Initialize based on mode
  switch (connectionMode) {
    case 0:
      Serial.println("WiFi");
      setupWiFi();
      break;
    case 1:
      Serial.println("Bluetooth Low Energy (BLE)");
      setupBLE();
      break;
    case 2:
      Serial.println("USB Serial");
      setupUSBSerial();
      break;
  }
  
  Serial.println("\n✓ Setup Complete!\n");
  blinkLED(connectionMode + 1, 300);
}

// ====== MAIN LOOP ======
void loop() {
  switch (connectionMode) {
    case 0:
      loopWiFi();
      break;
    case 1:
      loopBLE();
      break;
    case 2:
      loopUSBSerial();
      break;
  }
  
  // Common: Sample ECG if recording
  if (isRecording && (millis() - lastSampleTime >= SAMPLE_INTERVAL)) {
    sampleECG();
    lastSampleTime = millis();
  }
  
  // Send batch when buffer is full
  if (bufferIndex >= BATCH_SIZE) {
    sendBatch();
  }
}

// ====== WiFi MODE ======
void setupWiFi() {
  Serial.print("Connecting to WiFi: ");
  Serial.println(WIFI_SSID);
  
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✓ WiFi Connected!");
    Serial.print("  IP: ");
    Serial.println(WiFi.localIP());
    
    // Setup WebSocket
    webSocket.begin(SERVER_IP, SERVER_PORT, "/ws/esp32");
    webSocket.onEvent(webSocketEvent);
    webSocket.setReconnectInterval(3000);
    
    isConnected = true;
  } else {
    Serial.println("\n✗ WiFi Failed! Switching to USB Serial mode.");
    connectionMode = 2;
    setupUSBSerial();
  }
}

void loopWiFi() {
  webSocket.loop();
  
  if (WiFi.status() != WL_CONNECTED) {
    isConnected = false;
    Serial.println("WiFi lost! Reconnecting...");
    WiFi.reconnect();
  }
  
  // Heartbeat
  if (millis() - lastHeartbeat > 30000) {
    sendHeartbeat();
    lastHeartbeat = millis();
  }
}

void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
  switch(type) {
    case WStype_DISCONNECTED:
      isConnected = false;
      isRecording = false;
      digitalWrite(LED_PIN, LOW);
      Serial.println("✗ WebSocket Disconnected");
      break;
      
    case WStype_CONNECTED:
      isConnected = true;
      digitalWrite(LED_PIN, HIGH);
      Serial.println("✓ WebSocket Connected!");
      sendDeviceStatus();
      break;
      
    case WStype_TEXT:
      handleWebSocketMessage((char*)payload, length);
      break;
  }
}

void handleWebSocketMessage(char* payload, size_t length) {
  Serial.print("📥 WS: ");
  Serial.println(payload);
  
  DynamicJsonDocument doc(1024);
  DeserializationError error = deserializeJson(doc, payload);
  
  if (error) return;
  
  const char* event = doc["event"] | "";
  const char* type = doc["type"] | "";
  
  // Handle both 'event' and 'type' formats
  if (strcmp(event, "start-recording") == 0 || strcmp(type, "start-recording") == 0) {
    sessionId = doc["sessionId"] | "";
    isRecording = true;
    bufferIndex = 0;
    lastSampleTime = millis();
    Serial.println("▶ Recording Started - Session: " + sessionId);
    blinkLED(2, 100);
  }
  else if (strcmp(event, "stop-recording") == 0 || strcmp(type, "stop-recording") == 0) {
    isRecording = false;
    if (bufferIndex > 0) sendBatch();
    Serial.println("■ Recording Stopped");
    sessionId = "";
    blinkLED(1, 500);
  }
}

// ====== BLE MODE ======
void setupBLE() {
  Serial.println("Initializing BLE...");
  
  // Disable WiFi to save power
  WiFi.mode(WIFI_OFF);
  
  BLEDevice::init(deviceId.c_str());
  
  // Create BLE Server
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new ServerCallbacks());
  
  // Create BLE Service
  BLEService *pService = pServer->createService(SERVICE_UUID);
  
  // ECG Data Characteristic (Notify)
  pECGCharacteristic = pService->createCharacteristic(
    ECG_CHAR_UUID,
    BLECharacteristic::PROPERTY_READ |
    BLECharacteristic::PROPERTY_NOTIFY
  );
  pECGCharacteristic->addDescriptor(new BLE2902());
  
  // Control Characteristic (Write)
  pControlCharacteristic = pService->createCharacteristic(
    CONTROL_CHAR_UUID,
    BLECharacteristic::PROPERTY_WRITE
  );
  pControlCharacteristic->setCallbacks(new ControlCallbacks());
  
  // Device Info Characteristic (Read)
  pDeviceInfoCharacteristic = pService->createCharacteristic(
    DEVICE_INFO_UUID,
    BLECharacteristic::PROPERTY_READ
  );
  
  // Set device info
  DynamicJsonDocument infoDoc(256);
  infoDoc["deviceId"] = deviceId;
  infoDoc["sampleRate"] = SAMPLE_RATE;
  infoDoc["firmware"] = "2.0.0-BLE";
  String infoStr;
  serializeJson(infoDoc, infoStr);
  pDeviceInfoCharacteristic->setValue(infoStr.c_str());
  
  // Start service
  pService->start();
  
  // Start advertising
  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(true);
  pAdvertising->setMinPreferred(0x06);
  BLEDevice::startAdvertising();
  
  Serial.println("✓ BLE Ready - Advertising as: " + deviceId);
  Serial.println("  Service UUID: " + String(SERVICE_UUID));
}

void loopBLE() {
  // Handle connect/disconnect
  if (!bleDeviceConnected && oldBleDeviceConnected) {
    delay(500);
    pServer->startAdvertising();
    Serial.println("📢 BLE Advertising restarted");
    oldBleDeviceConnected = bleDeviceConnected;
  }
  
  if (bleDeviceConnected && !oldBleDeviceConnected) {
    oldBleDeviceConnected = bleDeviceConnected;
  }
}

void sendBLEData() {
  if (!bleDeviceConnected || bufferIndex == 0) return;
  
  // Create JSON with batch data
  DynamicJsonDocument doc(2048);
  doc["sessionId"] = sessionId;
  doc["deviceId"] = deviceId;
  
  JsonArray dataArray = doc.createNestedArray("data");
  
  for (int i = 0; i < bufferIndex; i++) {
    JsonObject point = dataArray.createNestedObject();
    point["t"] = dataBuffer[i].timestamp;
    point["v"] = round(dataBuffer[i].voltage * 100) / 100.0;
    point["q"] = (int)dataBuffer[i].quality;
    point["lo"] = dataBuffer[i].leadsOff ? 1 : 0;
  }
  
  String output;
  serializeJson(doc, output);
  
  // Send via BLE notification
  pECGCharacteristic->setValue(output.c_str());
  pECGCharacteristic->notify();
  
  Serial.printf("📤 BLE: Sent %d samples\n", bufferIndex);
  bufferIndex = 0;
}

// ====== USB SERIAL MODE ======
void setupUSBSerial() {
  Serial.println("USB Serial Mode Active");
  Serial.println("Commands: START, STOP, STATUS, INFO");
  Serial.println("Ready to receive commands...");
  
  // Disable WiFi to save power
  WiFi.mode(WIFI_OFF);
  
  isConnected = true;
  digitalWrite(LED_PIN, HIGH);
  
  // Print device info
  printDeviceInfo();
}

void loopUSBSerial() {
  // Check for serial commands
  if (Serial.available()) {
    String command = Serial.readStringUntil('\n');
    command.trim();
    command.toUpperCase();
    
    handleUSBCommand(command);
  }
}

void handleUSBCommand(String command) {
  Serial.print("📥 USB Command: ");
  Serial.println(command);
  
  if (command == "START" || command.startsWith("{\"cmd\":\"start\"")) {
    sessionId = "usb-session-" + String(millis());
    isRecording = true;
    bufferIndex = 0;
    lastSampleTime = millis();
    Serial.println("{\"status\":\"recording\",\"sessionId\":\"" + sessionId + "\"}");
    blinkLED(2, 100);
  }
  else if (command == "STOP" || command.startsWith("{\"cmd\":\"stop\"")) {
    isRecording = false;
    if (bufferIndex > 0) sendBatch();
    Serial.println("{\"status\":\"stopped\"}");
    sessionId = "";
    blinkLED(1, 500);
  }
  else if (command == "STATUS") {
    printStatus();
  }
  else if (command == "INFO") {
    printDeviceInfo();
  }
  else if (command == "HELP") {
    Serial.println("Commands: START, STOP, STATUS, INFO, HELP");
  }
  else {
    // Try to parse as JSON
    DynamicJsonDocument doc(256);
    DeserializationError error = deserializeJson(doc, command);
    
    if (!error) {
      const char* cmd = doc["cmd"] | "";
      if (strcmp(cmd, "start") == 0) {
        sessionId = doc["sessionId"] | ("usb-" + String(millis()));
        isRecording = true;
        bufferIndex = 0;
        Serial.println("{\"status\":\"recording\",\"sessionId\":\"" + sessionId + "\"}");
      }
      else if (strcmp(cmd, "stop") == 0) {
        isRecording = false;
        Serial.println("{\"status\":\"stopped\"}");
      }
    }
  }
}

void sendUSBSerialData() {
  if (bufferIndex == 0) return;
  
  // Send as JSON
  DynamicJsonDocument doc(4096);
  doc["type"] = "ecg-data";
  doc["sessionId"] = sessionId;
  doc["deviceId"] = deviceId;
  doc["timestamp"] = millis();
  
  JsonArray dataArray = doc.createNestedArray("data");
  
  for (int i = 0; i < bufferIndex; i++) {
    JsonObject point = dataArray.createNestedObject();
    point["timestamp"] = dataBuffer[i].timestamp;
    point["voltage"] = round(dataBuffer[i].voltage * 100) / 100.0;
    point["quality"] = (int)dataBuffer[i].quality;
    point["leadsOff"] = dataBuffer[i].leadsOff;
  }
  
  serializeJson(doc, Serial);
  Serial.println(); // Newline for parsing
  
  bufferIndex = 0;
}

void printDeviceInfo() {
  DynamicJsonDocument doc(512);
  doc["type"] = "device-info";
  doc["deviceId"] = deviceId;
  doc["firmware"] = "2.0.0-USB";
  doc["sampleRate"] = SAMPLE_RATE;
  doc["batchSize"] = BATCH_SIZE;
  doc["mode"] = "USB-Serial";
  doc["baudRate"] = USB_BAUD_RATE;
  
  serializeJson(doc, Serial);
  Serial.println();
}

void printStatus() {
  DynamicJsonDocument doc(256);
  doc["type"] = "status";
  doc["recording"] = isRecording;
  doc["sessionId"] = sessionId;
  doc["bufferUsed"] = bufferIndex;
  doc["uptime"] = millis() / 1000;
  
  // Add GPIO debug info
  int rawADC = analogRead(ECG_PIN);
  bool gpio2State = digitalRead(LO_MINUS_PIN);
  bool gpio4State = digitalRead(LO_PLUS_PIN);
  
  doc["debug"]["rawADC"] = rawADC;
  doc["debug"]["gpio2_state"] = gpio2State;
  doc["debug"]["gpio4_state"] = gpio4State;
  
  serializeJson(doc, Serial);
  Serial.println();
}

// ====== COMMON FUNCTIONS ======
void sampleECG() {
  int rawValue = analogRead(ECG_PIN);
  float voltage = (rawValue / (float)ADC_MAX) * VOLTAGE_REF;
  float voltageMV = (voltage - (VOLTAGE_REF / 2.0)) * 1000.0;
  
  bool loMinus = digitalRead(LO_MINUS_PIN);
  bool loPlus = digitalRead(LO_PLUS_PIN);
  bool leadsOff = (loMinus == HIGH || loPlus == HIGH);
  
  float quality = leadsOff ? 0.0 : calculateQuality(voltageMV);
  
  dataBuffer[bufferIndex].timestamp = millis();
  dataBuffer[bufferIndex].voltage = voltageMV;
  dataBuffer[bufferIndex].leadsOff = leadsOff;
  dataBuffer[bufferIndex].quality = quality;
  
  bufferIndex++;
  
  // LED feedback
  if (bufferIndex % 50 == 0) {
    digitalWrite(LED_PIN, !digitalRead(LED_PIN));
  }
}

float calculateQuality(float voltage) {
  // Simple quality estimation
  float absVoltage = abs(voltage);
  if (absVoltage < 0.1) return 20.0;  // Very low signal
  if (absVoltage > 2.0) return 30.0;  // Possible noise
  return min(100.0, 50.0 + absVoltage * 25.0);
}

void sendBatch() {
  switch (connectionMode) {
    case 0:
      sendWiFiBatch();
      break;
    case 1:
      sendBLEData();
      break;
    case 2:
      sendUSBSerialData();
      break;
  }
}

void sendWiFiBatch() {
  if (!isConnected || bufferIndex == 0) return;
  
  DynamicJsonDocument doc(4096);
  doc["type"] = "ecg-data";
  doc["sessionId"] = sessionId;
  
  JsonArray dataArray = doc.createNestedArray("data");
  
  for (int i = 0; i < bufferIndex; i++) {
    JsonObject point = dataArray.createNestedObject();
    point["timestamp"] = dataBuffer[i].timestamp;
    point["voltage"] = round(dataBuffer[i].voltage * 100) / 100.0;
  }
  
  String output;
  serializeJson(doc, output);
  webSocket.sendTXT(output);
  
  bufferIndex = 0;
}

void sendDeviceStatus() {
  DynamicJsonDocument doc(512);
  doc["type"] = "register";
  doc["deviceId"] = deviceId;
  doc["deviceName"] = DEVICE_NAME;
  doc["firmwareVersion"] = "2.0.0";
  doc["batteryLevel"] = 100;
  doc["sampleRate"] = SAMPLE_RATE;
  
  String output;
  serializeJson(doc, output);
  webSocket.sendTXT(output);
}

void sendHeartbeat() {
  if (!isConnected) return;
  
  DynamicJsonDocument doc(128);
  doc["type"] = "heartbeat";
  doc["deviceId"] = deviceId;
  
  String output;
  serializeJson(doc, output);
  webSocket.sendTXT(output);
}

void checkModeButton() {
  Serial.println("Hold BOOT button for 3 seconds to change mode...");
  
  unsigned long startTime = millis();
  while (digitalRead(MODE_BUTTON_PIN) == LOW) {
    if (millis() - startTime > 3000) {
      connectionMode = (connectionMode + 1) % 3;
      preferences.putInt("mode", connectionMode);
      
      Serial.print("Mode changed to: ");
      Serial.println(connectionMode == 0 ? "WiFi" : (connectionMode == 1 ? "BLE" : "USB Serial"));
      
      blinkLED(5, 100);
      break;
    }
    delay(100);
  }
}

void blinkLED(int times, int delayMs) {
  for (int i = 0; i < times; i++) {
    digitalWrite(LED_PIN, HIGH);
    delay(delayMs);
    digitalWrite(LED_PIN, LOW);
    delay(delayMs);
  }
}

void printBanner() {
  Serial.println("\n╔════════════════════════════════════════════╗");
  Serial.println("║   HeartWise ECG Monitor - Multi-Mode       ║");
  Serial.println("║   WiFi | Bluetooth LE | USB Serial         ║");
  Serial.println("╚════════════════════════════════════════════╝\n");
}
