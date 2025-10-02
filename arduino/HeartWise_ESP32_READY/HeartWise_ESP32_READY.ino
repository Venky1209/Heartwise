/*
 * HeartWise ECG Monitor - ESP32 + AD8232 Integration
 * READY TO UPLOAD VERSION
 * 
 * Hardware Connections:
 * - AD8232 OUTPUT -> ESP32 GPIO34 (A0)
 * - AD8232 LO-    -> ESP32 GPIO2
 * - AD8232 LO+    -> ESP32 GPIO4
 * - AD8232 3.3V   -> ESP32 3.3V
 * - AD8232 GND    -> ESP32 GND
 * 
 * BEFORE UPLOADING:
 * 1. Install Libraries in Arduino IDE:
 *    - WebSockets by Markus Sattler
 *    - ArduinoJson by Benoit Blanchon
 * 2. Update WiFi credentials below
 * 3. Update server IP below - Your Mac IP
 */

#include <WiFi.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>

// ====== CONFIGURATION - UPDATE THESE VALUES ======
const char* WIFI_SSID = "Dayalan";       // ✓ Your WiFi name (2.4GHz)
const char* WIFI_PASSWORD = "9994238295@D";   // ✓ Your WiFi password

// Server Configuration (Your Mac's IP address)
const char* SERVER_IP = "192.168.1.11";  // ← Your Mac's current IP address
const int SERVER_PORT = 5001;
const char* WEBSOCKET_PATH = "/ws/esp32";  // Plain WebSocket path for ESP32

// Device Configuration
const char* DEVICE_ID = "HEARTWISE-ESP32-01-050";  // Fixed device ID to match database
const char* DEVICE_NAME = "HeartWise-ESP32-01";
// ==================================================

// Pin Definitions
const int ECG_PIN = 34;           // AD8232 OUTPUT - GPIO34 (ADC1_CH6)
const int LO_MINUS_PIN = 2;       // AD8232 LO- (leads off detection)
const int LO_PLUS_PIN = 4;        // AD8232 LO+ (leads off detection)
const int LED_PIN = 2;            // Built-in LED

// ECG Sampling Configuration
const int SAMPLE_RATE = 250;      // 250 Hz sampling rate
const int SAMPLE_INTERVAL = 1000 / SAMPLE_RATE; // 4ms between samples
const int BATCH_SIZE = 25;        // Send 25 samples at a time
const float VOLTAGE_REF = 3.3;    // ESP32 ADC reference voltage
const int ADC_MAX = 4095;         // 12-bit ADC resolution

// Global Variables
WebSocketsClient webSocket;
String sessionId = "";
bool isConnected = false;
bool isRecording = false;
unsigned long lastSampleTime = 0;
unsigned long lastHeartbeat = 0;

// Data Buffer
struct ECGData {
  unsigned long timestamp;
  float voltage;
  bool leadsOff;
  float quality;
};

ECGData dataBuffer[BATCH_SIZE];
int bufferIndex = 0;

// ===========================================
// SETUP
// ===========================================
void setup() {
  Serial.begin(115200);
  delay(2000);
  
  Serial.println("\n╔════════════════════════════════════════╗");
  Serial.println("║   HeartWise ECG Monitor - ESP32        ║");
  Serial.println("║   Hardware: ESP32 + AD8232 Sensor      ║");
  Serial.println("╚════════════════════════════════════════╝\n");
  
  // Initialize pins
  pinMode(LO_MINUS_PIN, INPUT);
  pinMode(LO_PLUS_PIN, INPUT);
  pinMode(ECG_PIN, INPUT);
  pinMode(LED_PIN, OUTPUT);
  
  Serial.print("Device ID: ");
  Serial.println(DEVICE_ID);
  Serial.println("");
  
  // Connect to WiFi
  connectWiFi();

  
  // Connect to WebSocket server
  connectWebSocket();
  
  Serial.println("\n✓ Setup Complete - Ready to monitor ECG!\n");
  blinkLED(3, 200); // Success indication
}

// ===========================================
// MAIN LOOP
// ===========================================
void loop() {
  webSocket.loop();
  
  // Check WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected! Reconnecting...");
    connectWiFi();
  }
  
  // Send heartbeat every 30 seconds
  if (millis() - lastHeartbeat > 30000) {
    sendHeartbeat();
    lastHeartbeat = millis();
  }
  
  // Sample ECG data if recording
  if (isRecording && (millis() - lastSampleTime >= SAMPLE_INTERVAL)) {
    sampleECG();
    lastSampleTime = millis();
  }
  
  // Send batch when buffer is full
  if (bufferIndex >= BATCH_SIZE) {
    sendBatch();
  }
}

// ===========================================
// WiFi CONNECTION
// ===========================================
void connectWiFi() {
  Serial.println("Connecting to WiFi: " + String(WIFI_SSID));
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✓ WiFi Connected!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
    Serial.print("Backend Server: ");
    Serial.println(SERVER_IP);
    Serial.print("Signal Strength: ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
    digitalWrite(LED_PIN, HIGH);
  } else {
    Serial.println("\n✗ WiFi Connection Failed!");
    Serial.println("Check SSID/Password and try again...");
    delay(5000);
    ESP.restart();
  }
}

// ===========================================
// WEBSOCKET CONNECTION
// ===========================================
void connectWebSocket() {
  Serial.println("\nConnecting to WebSocket server...");
  Serial.print("Server: ");
  Serial.print(SERVER_IP);
  Serial.print(":");
  Serial.println(SERVER_PORT);
  
  webSocket.begin(SERVER_IP, SERVER_PORT, WEBSOCKET_PATH);
  webSocket.onEvent(webSocketEvent);
  webSocket.setReconnectInterval(5000);
  
  Serial.println("✓ WebSocket configured");
}

// ===========================================
// WEBSOCKET EVENT HANDLER
// ===========================================
void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
  switch(type) {
    case WStype_DISCONNECTED:
      Serial.println("⚠ WebSocket Disconnected");
      isConnected = false;
      isRecording = false;
      digitalWrite(LED_PIN, LOW);
      break;
      
    case WStype_CONNECTED:
      Serial.println("✓ WebSocket Connected!");
      isConnected = true;
      digitalWrite(LED_PIN, HIGH);
      registerDevice();  // Register device with backend
      break;
      
    case WStype_TEXT:
      handleWebSocketMessage((char*)payload, length);
      break;
      
    case WStype_ERROR:
      Serial.println("✗ WebSocket Error");
      break;
  }
}

// ===========================================
// HANDLE WEBSOCKET MESSAGES
// ===========================================
void handleWebSocketMessage(char* payload, size_t length) {
  Serial.print("Received: ");
  Serial.println(payload);
  
  // Parse JSON message
  DynamicJsonDocument doc(1024);
  DeserializationError error = deserializeJson(doc, payload);
  
  if (error) {
    Serial.print("JSON parse error: ");
    Serial.println(error.c_str());
    return;
  }
  
  // Handle different message types
  const char* msgType = doc["type"] | "";
  
  if (strcmp(msgType, "connected") == 0) {
    Serial.println("✓ Server acknowledged connection");
  }
  else if (strcmp(msgType, "registered") == 0) {
    Serial.println("✓ Device registered with backend");
  }
  else if (strcmp(msgType, "ack") == 0) {
    int received = doc["received"] | 0;
    Serial.print("✓ Data acknowledged: ");
    Serial.print(received);
    Serial.println(" points");
  }
  else if (strcmp(msgType, "pong") == 0) {
    Serial.println("✓ Heartbeat OK");
  }
  else if (strcmp(msgType, "start-recording") == 0) {
    sessionId = doc["sessionId"] | "";
    isRecording = true;
    bufferIndex = 0;
    lastSampleTime = millis();
    Serial.println("▶ Recording Started - Session: " + sessionId);
    blinkLED(2, 100);
  }
  else if (strcmp(msgType, "recording-started") == 0) {
    sessionId = doc["sessionId"] | "";
    isRecording = true;
    bufferIndex = 0;
    lastSampleTime = millis();
    Serial.println("▶ Recording Started - Session: " + sessionId);
    blinkLED(2, 100);
  }
  else if (strcmp(msgType, "stop-recording") == 0) {
    isRecording = false;
    if (bufferIndex > 0) {
      sendBatch(); // Send remaining data
    }
    Serial.println("■ Recording Stopped");
    sessionId = "";
    blinkLED(1, 500);
  }
  else if (strcmp(msgType, "recording-stopped") == 0) {
    isRecording = false;
    if (bufferIndex > 0) {
      sendBatch(); // Send remaining data
    }
    Serial.println("■ Recording Stopped");
    sessionId = "";
    blinkLED(1, 500);
  }
}

// ===========================================
// SAMPLE ECG DATA
// ===========================================
void sampleECG() {
  // Read ECG signal
  int rawValue = analogRead(ECG_PIN);
  float voltage = (rawValue / (float)ADC_MAX) * VOLTAGE_REF;
  
  // Convert to millivolts (centered around 1.65V)
  float voltageMV = (voltage - (VOLTAGE_REF / 2.0)) * 1000.0;
  
  // Check leads-off detection
  bool loMinus = digitalRead(LO_MINUS_PIN);
  bool loPlus = digitalRead(LO_PLUS_PIN);
  bool leadsOff = (loMinus == HIGH || loPlus == HIGH);
  
  // Calculate signal quality (0-100)
  float quality = leadsOff ? 0.0 : calculateQuality(voltageMV);
  
  // Store in buffer
  dataBuffer[bufferIndex].timestamp = millis();
  dataBuffer[bufferIndex].voltage = voltageMV;
  dataBuffer[bufferIndex].leadsOff = leadsOff;
  dataBuffer[bufferIndex].quality = quality;
  
  bufferIndex++;
  
  // Visual feedback (blink on every 50th sample)
  if (bufferIndex % 50 == 0) {
    digitalWrite(LED_PIN, !digitalRead(LED_PIN));
  }
  
  // Debug output (every 250 samples = 1 second)
  static int sampleCount = 0;
  sampleCount++;
  if (sampleCount >= 250) {
    Serial.printf("ECG: %.2f mV | Leads: %s | Quality: %.0f%%\n", 
                  voltageMV, 
                  leadsOff ? "OFF" : "ON", 
                  quality);
    sampleCount = 0;
  }
}

// ===========================================
// CALCULATE SIGNAL QUALITY
// ===========================================
float calculateQuality(float voltage) {
  // Simple quality metric based on signal amplitude
  float absVoltage = abs(voltage);
  
  if (absVoltage < 0.1) return 30.0;      // Very weak signal
  if (absVoltage < 0.5) return 60.0;      // Weak signal
  if (absVoltage < 2.0) return 85.0;      // Good signal
  if (absVoltage < 5.0) return 95.0;      // Excellent signal
  return 70.0;                             // Too high (possible noise)
}

// ===========================================
// SEND DATA BATCH
// ===========================================
void sendBatch() {
  if (!isConnected || sessionId.length() == 0 || bufferIndex == 0) {
    return;
  }
  
  // Create JSON document
  DynamicJsonDocument doc(8192);
  doc["type"] = "ecg-data";
  doc["sessionId"] = sessionId;
  doc["deviceId"] = DEVICE_ID;
  
  JsonArray dataArray = doc.createNestedArray("data");
  
  for (int i = 0; i < bufferIndex; i++) {
    JsonObject point = dataArray.createNestedObject();
    point["timestamp"] = dataBuffer[i].timestamp;
    point["voltage"] = dataBuffer[i].voltage;
    point["leads_off"] = dataBuffer[i].leadsOff;
    point["quality_score"] = dataBuffer[i].quality;
  }
  
  // Serialize and send
  String jsonString;
  serializeJson(doc, jsonString);
  webSocket.sendTXT(jsonString);
  
  Serial.printf("→ Sent batch: %d samples\n", bufferIndex);
  
  // Reset buffer
  bufferIndex = 0;
}

// ===========================================
// ===========================================
// REGISTER DEVICE WITH BACKEND
// ===========================================
void registerDevice() {
  if (!isConnected) return;
  
  DynamicJsonDocument doc(512);
  doc["type"] = "register";
  doc["deviceId"] = DEVICE_ID;
  doc["deviceName"] = DEVICE_NAME;
  doc["firmwareVersion"] = "1.0.0";
  doc["sampleRate"] = SAMPLE_RATE;
  doc["signalStrength"] = WiFi.RSSI();
  
  String jsonString;
  serializeJson(doc, jsonString);
  webSocket.sendTXT(jsonString);
  
  Serial.println("→ Device registration sent");
}

// ===========================================
// SEND DEVICE STATUS (legacy - kept for compatibility)
// ===========================================
void sendDeviceStatus() {
  registerDevice();
}

// ===========================================
// SEND HEARTBEAT
// ===========================================
void sendHeartbeat() {
  if (!isConnected) return;
  
  DynamicJsonDocument doc(256);
  doc["type"] = "heartbeat";
  doc["deviceId"] = DEVICE_ID;
  doc["timestamp"] = millis();
  
  String jsonString;
  serializeJson(doc, jsonString);
  webSocket.sendTXT(jsonString);
}

// ===========================================
// LED BLINK UTILITY
// ===========================================
void blinkLED(int times, int delayMs) {
  for (int i = 0; i < times; i++) {
    digitalWrite(LED_PIN, LOW);
    delay(delayMs);
    digitalWrite(LED_PIN, HIGH);
    delay(delayMs);
  }
}
