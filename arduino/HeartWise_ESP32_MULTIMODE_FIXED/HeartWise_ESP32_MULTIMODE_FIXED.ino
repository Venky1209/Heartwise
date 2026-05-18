/*
 * HeartWise ECG Monitor - ESP32 FIXED Multi-Mode Version
 * Supports: WiFi, Bluetooth Low Energy (BLE), and USB Serial
 * FIXED: ECG_PIN = 34, LED_PIN = 13 (not GPIO 2)
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
#define CONNECTION_MODE 2  // 0=WiFi, 1=BLE, 2=USB Serial

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

// ====== DEVICE CONFIGURATION ======
const char* DEVICE_NAME = "HeartWise-ESP32";

// ====== PIN DEFINITIONS - CORRECTED ======
const int ECG_PIN = 34;          // AD8232 OUTPUT -> ESP32 GPIO34
const int LO_MINUS_PIN = 2;      // AD8232 LO- -> ESP32 GPIO2
const int LO_PLUS_PIN = 4;       // AD8232 LO+ -> ESP32 GPIO4
const int LED_PIN = 13;          // Status LED -> ESP32 GPIO13
const int MODE_BUTTON_PIN = 0;   // Mode button -> ESP32 GPIO0 (BOOT)

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
unsigned long lastStatusPrint = 0;
Preferences preferences;

// WiFi variables
WebSocketsClient webSocket;

// BLE variables
BLEServer* pServer = NULL;
BLECharacteristic* pECGCharacteristic = NULL;
BLECharacteristic* pControlCharacteristic = NULL;
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
    pServer->startAdvertising();
  }
};

class ControlCallbacks: public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic *pCharacteristic) {
    String value = String(pCharacteristic->getValue().c_str());
    if (value.length() > 0) {
      Serial.print("📥 BLE Command: ");
      Serial.println(value.c_str());
      
      if (value.indexOf("start") >= 0) {
        sessionId = "ble-session-" + String(millis());
        isRecording = true;
        bufferIndex = 0;
        Serial.println("▶️ BLE Recording Started");
      }
      else if (value.indexOf("stop") >= 0) {
        isRecording = false;
        Serial.println("⏹️ BLE Recording Stopped");
      }
    }
  }
};

// ====== SETUP ======
void setup() {
  Serial.begin(115200);
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
  
  Serial.println("Device ID: " + deviceId);
  Serial.println("Pin Configuration:");
  Serial.printf("  ECG_PIN (ADC): GPIO%d\n", ECG_PIN);
  Serial.printf("  LO_MINUS (Lead Detection): GPIO%d\n", LO_MINUS_PIN);
  Serial.printf("  LO_PLUS (Lead Detection): GPIO%d\n", LO_PLUS_PIN);
  Serial.printf("  LED_PIN (Status): GPIO%d\n", LED_PIN);
  
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
  
  Serial.println("\n✅ Setup Complete!\n");
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
  
  // Sample ECG if recording
  if (isRecording && (millis() - lastSampleTime >= SAMPLE_INTERVAL)) {
    sampleECG();
    lastSampleTime = millis();
  }
  
  // Send batch when buffer is full
  if (bufferIndex >= BATCH_SIZE) {
    sendBatch();
  }
  
  // Print status periodically
  if (millis() - lastStatusPrint > 10000) {
    printStatus();
    lastStatusPrint = millis();
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
    Serial.println("\n✅ WiFi Connected!");
    Serial.print("   IP: ");
    Serial.println(WiFi.localIP());
    
    webSocket.begin(SERVER_IP, SERVER_PORT, "/ws/esp32");
    webSocket.onEvent(webSocketEvent);
    webSocket.setReconnectInterval(3000);
    
    isConnected = true;
  } else {
    Serial.println("\n❌ WiFi Failed! Switching to USB Serial mode.");
    connectionMode = 2;
    setupUSBSerial();
  }
}

void loopWiFi() {
  webSocket.loop();
  
  if (WiFi.status() != WL_CONNECTED) {
    isConnected = false;
    Serial.println("📶 WiFi disconnected, reconnecting...");
    WiFi.reconnect();
  } else if (WiFi.status() == WL_CONNECTED && !isConnected) {
    isConnected = true;
    Serial.println("📶 WiFi reconnected!");
  }
  
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
      Serial.println("❌ WebSocket Disconnected");
      break;
      
    case WStype_CONNECTED:
      isConnected = true;
      digitalWrite(LED_PIN, HIGH);
      Serial.println("✅ WebSocket Connected!");
      sendDeviceStatus();
      break;
      
    case WStype_TEXT:
      {
        String payload_str = String((char*)payload);
        if (payload_str.indexOf("start") >= 0) {
          sessionId = "ws-session-" + String(millis());
          isRecording = true;
          bufferIndex = 0;
          Serial.println("▶️ WiFi Recording Started");
        }
        else if (payload_str.indexOf("stop") >= 0) {
          isRecording = false;
          if (bufferIndex > 0) sendBatch();
          Serial.println("⏹️ WiFi Recording Stopped");
        }
      }
      break;
  }
}

// ====== BLE MODE ======
void setupBLE() {
  Serial.println("Initializing BLE...");
  
  WiFi.mode(WIFI_OFF);
  
  BLEDevice::init(deviceId.c_str());
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new ServerCallbacks());
  
  BLEService *pService = pServer->createService(SERVICE_UUID);
  
  pECGCharacteristic = pService->createCharacteristic(
    ECG_CHAR_UUID,
    BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY
  );
  pECGCharacteristic->addDescriptor(new BLE2902());
  
  pControlCharacteristic = pService->createCharacteristic(
    CONTROL_CHAR_UUID,
    BLECharacteristic::PROPERTY_WRITE
  );
  pControlCharacteristic->setCallbacks(new ControlCallbacks());
  
  pService->start();
  
  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(true);
  pAdvertising->setMinPreferred(0x06);
  BLEDevice::startAdvertising();
  
  Serial.println("✅ BLE Ready - Advertising as: " + deviceId);
}

void loopBLE() {
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
  
  String output = "{\"data\":[";
  for (int i = 0; i < bufferIndex; i++) {
    if (i > 0) output += ",";
    output += "{\"t\":" + String(dataBuffer[i].timestamp) + 
              ",\"v\":" + String(dataBuffer[i].voltage, 2) + 
              ",\"lo\":" + (dataBuffer[i].leadsOff ? "1" : "0") + "}";
  }
  output += "]}";
  
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
  
  WiFi.mode(WIFI_OFF);
  
  isConnected = true;
  digitalWrite(LED_PIN, HIGH);
  
  printDeviceInfo();
}

void loopUSBSerial() {
  if (Serial.available()) {
    String command = Serial.readStringUntil('\n');
    command.trim();
    
    handleUSBCommand(command);
  }
}

void handleUSBCommand(String command) {
  Serial.print("📥 Command: ");
  Serial.println(command);
  
  String upper = command;
  upper.toUpperCase();
  
  if (upper == "START") {
    sessionId = "usb-" + String(millis());
    isRecording = true;
    bufferIndex = 0;
    lastSampleTime = millis();
    Serial.println("{\"status\":\"recording\",\"sessionId\":\"" + sessionId + "\"}");
    blinkLED(2, 100);
  }
  else if (upper == "STOP") {
    isRecording = false;
    if (bufferIndex > 0) sendBatch();
    Serial.println("{\"status\":\"stopped\"}");
    sessionId = "";
    blinkLED(1, 500);
  }
  else if (upper == "STATUS") {
    printStatus();
  }
  else if (upper == "INFO") {
    printDeviceInfo();
  }
  else if (upper == "HELP") {
    Serial.println("Commands: START, STOP, STATUS, INFO, HELP");
  }
}

void sendUSBSerialData() {
  if (bufferIndex == 0) return;
  
  String output = "{\"type\":\"ecg-data\",\"sessionId\":\"" + sessionId + 
                  "\",\"deviceId\":\"" + deviceId + "\",\"data\":[";
  
  for (int i = 0; i < bufferIndex; i++) {
    if (i > 0) output += ",";
    output += "{\"timestamp\":" + String(dataBuffer[i].timestamp) + 
              ",\"voltage\":" + String(dataBuffer[i].voltage, 2) + 
              ",\"quality\":" + String((int)dataBuffer[i].quality) + 
              ",\"leadsOff\":" + (dataBuffer[i].leadsOff ? "true" : "false") + "}";
  }
  output += "]}";
  
  Serial.println(output);
  
  bufferIndex = 0;
}

void printDeviceInfo() {
  Serial.println("{\"type\":\"device-info\",\"deviceId\":\"" + deviceId + 
                 "\",\"firmware\":\"2.0.0-FIXED\",\"sampleRate\":" + 
                 String(SAMPLE_RATE) + ",\"batchSize\":" + String(BATCH_SIZE) + "}");
}

void printStatus() {
  Serial.print("{\"type\":\"status\",\"recording\":");
  Serial.print(isRecording ? "true" : "false");
  Serial.print(",\"bufferUsed\":" + String(bufferIndex) + "/25");
  Serial.print(",\"uptime\":" + String(millis() / 1000));
  
  // Read GPIO states
  int rawADC = analogRead(ECG_PIN);
  int gpio2 = digitalRead(LO_MINUS_PIN);
  int gpio4 = digitalRead(LO_PLUS_PIN);
  float voltage = (rawADC / (float)ADC_MAX) * VOLTAGE_REF;
  float voltageMV = (voltage - (VOLTAGE_REF / 2.0)) * 1000.0;
  
  Serial.print(",\"gpio2\":" + String(gpio2));
  Serial.print(",\"gpio4\":" + String(gpio4));
  Serial.print(",\"voltage\":" + String(voltageMV, 2));
  Serial.println("}");
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
  float absVoltage = abs(voltage);
  if (absVoltage < 0.1) return 20.0;
  if (absVoltage > 2.0) return 30.0;
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
  
  String output = "{\"type\":\"ecg-data\",\"sessionId\":\"" + sessionId + "\",\"data\":[";
  
  for (int i = 0; i < bufferIndex; i++) {
    if (i > 0) output += ",";
    output += "{\"timestamp\":" + String(dataBuffer[i].timestamp) + 
              ",\"voltage\":" + String(dataBuffer[i].voltage, 2) + "}";
  }
  output += "]}";
  
  webSocket.sendTXT(output);
  
  bufferIndex = 0;
}

void sendDeviceStatus() {
  String output = "{\"type\":\"register\",\"deviceId\":\"" + deviceId + 
                  "\",\"firmware\":\"2.0.0-FIXED\",\"sampleRate\":" + String(SAMPLE_RATE) + "}";
  webSocket.sendTXT(output);
}

void sendHeartbeat() {
  if (!isConnected) return;
  
  String output = "{\"type\":\"heartbeat\",\"deviceId\":\"" + deviceId + "\"}";
  webSocket.sendTXT(output);
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
  Serial.println("║   HeartWise ECG - Multi-Mode (FIXED v2)   ║");
  Serial.println("║   ECG: GPIO34 | Leads: GPIO2,4 | LED: 13  ║");
  Serial.println("╚════════════════════════════════════════════╝\n");
}
