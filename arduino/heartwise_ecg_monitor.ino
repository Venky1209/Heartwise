/*
 * HeartWise ECG Monitor - ESP32 + AD8232 Integration
 * 
 * This Arduino sketch reads ECG signals from AD8232 sensor and sends
 * real-time data to the HeartWise backend server via WiFi.
 * 
 * Hardware Connections:
 * - AD8232 OUTPUT -> ESP32 Pin A0 (GPIO36)
 * - AD8232 LO- -> ESP32 Pin D2 (GPIO2)
 * - AD8232 LO+ -> ESP32 Pin D3 (GPIO4)
 * - AD8232 SDN -> ESP32 Pin D4 (GPIO5) (optional shutdown)
 * - AD8232 3.3V -> ESP32 3.3V
 * - AD8232 GND -> ESP32 GND
 * 
 * Author: HeartWise Team
 * Version: 1.0.0
 */

#include <WiFi.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>
#include <esp_wifi.h>

// WiFi Configuration
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Server Configuration
const char* server_host = "192.168.1.100"; // Replace with your server IP
const int server_port = 5000;
const char* websocket_path = "/socket.io/?EIO=4&transport=websocket";

// Pin Definitions
const int ECG_OUTPUT_PIN = 36;    // AD8232 output to ESP32 A0 (GPIO36)
const int LO_MINUS_PIN = 2;       // AD8232 LO- to ESP32 D2 (GPIO2)
const int LO_PLUS_PIN = 4;        // AD8232 LO+ to ESP32 D3 (GPIO4)
const int SHUTDOWN_PIN = 5;       // AD8232 SDN to ESP32 D4 (GPIO5)
const int LED_PIN = 2;            // Built-in LED for status indication

// ECG Configuration
const int SAMPLE_RATE = 250;      // Hz - ECG sampling rate
const int SAMPLE_INTERVAL = 1000 / SAMPLE_RATE; // ms between samples
const int BATCH_SIZE = 25;        // Send data in batches for efficiency
const float VOLTAGE_REF = 3.3;    // ESP32 reference voltage
const int ADC_RESOLUTION = 4096;  // 12-bit ADC

// Device Configuration
String deviceId;
String sessionId = "";
bool isRecording = false;
unsigned long lastHeartbeat = 0;
const unsigned long HEARTBEAT_INTERVAL = 30000; // 30 seconds

// Data buffers
struct ECGDataPoint {
  unsigned long timestamp;
  float voltage;
  bool leadsOff;
  float qualityScore;
};

ECGDataPoint dataBuffer[BATCH_SIZE];
int bufferIndex = 0;
unsigned long sessionStartTime = 0;

// WebSocket client
WebSocketsClient webSocket;

// Battery monitoring (if using battery)
const int BATTERY_PIN = 39;      // GPIO39 for battery voltage monitoring
float batteryLevel = 100.0;

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n=== HeartWise ECG Monitor Starting ===");
  
  // Initialize pins
  pinMode(LO_MINUS_PIN, INPUT);
  pinMode(LO_PLUS_PIN, INPUT);
  pinMode(SHUTDOWN_PIN, OUTPUT);
  pinMode(LED_PIN, OUTPUT);
  
  // Enable AD8232
  digitalWrite(SHUTDOWN_PIN, HIGH);
  
  // Generate unique device ID from MAC address
  uint8_t mac[6];
  esp_wifi_get_mac(WIFI_IF_STA, mac);
  deviceId = String(mac[0], HEX) + String(mac[1], HEX) + 
             String(mac[2], HEX) + String(mac[3], HEX) + 
             String(mac[4], HEX) + String(mac[5], HEX);
  deviceId.toUpperCase();
  
  Serial.println("Device ID: " + deviceId);
  
  // Connect to WiFi
  connectToWiFi();
  
  // Initialize WebSocket connection
  webSocket.begin(server_host, server_port, websocket_path);
  webSocket.onEvent(webSocketEvent);
  webSocket.setReconnectInterval(5000);
  
  // Initial device registration
  registerDevice();
  
  Serial.println("Setup completed. Ready to monitor ECG signals.");
  blinkLED(3); // Indicate successful setup
}

void loop() {
  webSocket.loop();
  
  // Check WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected. Reconnecting...");
    connectToWiFi();
  }
  
  // Send heartbeat
  if (millis() - lastHeartbeat > HEARTBEAT_INTERVAL) {
    sendHeartbeat();
    lastHeartbeat = millis();
  }
  
  // Read ECG data if recording
  if (isRecording && sessionId != "") {
    readECGData();
  }
  
  // Monitor for serial commands
  handleSerialCommands();
  
  delay(SAMPLE_INTERVAL);
}

void connectToWiFi() {
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);
  
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi connected!");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());
    digitalWrite(LED_PIN, HIGH);
  } else {
    Serial.println("\nWiFi connection failed!");
    digitalWrite(LED_PIN, LOW);
  }
}

void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
  switch(type) {
    case WStype_DISCONNECTED:
      Serial.println("WebSocket Disconnected");
      digitalWrite(LED_PIN, LOW);
      break;
      
    case WStype_CONNECTED:
      Serial.printf("WebSocket Connected to: %s\n", payload);
      digitalWrite(LED_PIN, HIGH);
      registerDevice();
      break;
      
    case WStype_TEXT:
      Serial.printf("Received: %s\n", payload);
      handleWebSocketMessage((char*)payload);
      break;
      
    case WStype_ERROR:
      Serial.printf("WebSocket Error: %s\n", payload);
      break;
      
    default:
      break;
  }
}

void handleWebSocketMessage(String message) {
  DynamicJsonDocument doc(1024);
  deserializeJson(doc, message);
  
  String event = doc[0];
  
  if (event == "start-recording") {
    JsonObject data = doc[1];
    sessionId = data["sessionId"].as<String>();
    startRecording();
  }
  else if (event == "stop-recording") {
    stopRecording();
  }
  else if (event == "device-registered") {
    Serial.println("Device registered successfully");
  }
  else if (event == "error") {
    Serial.println("Server error: " + doc[1].as<String>());
  }
}

void registerDevice() {
  DynamicJsonDocument doc(512);
  doc["deviceId"] = deviceId;
  doc["deviceName"] = "HeartWise ECG Monitor";
  doc["firmwareVersion"] = "1.0.0";
  doc["batteryLevel"] = batteryLevel;
  
  JsonObject calibration = doc.createNestedObject("calibrationData");
  calibration["voltageReference"] = VOLTAGE_REF;
  calibration["adcResolution"] = ADC_RESOLUTION;
  calibration["sampleRate"] = SAMPLE_RATE;
  
  String message;
  serializeJson(doc, message);
  
  webSocket.sendTXT("42[\"device-status\"," + message + "]");
  Serial.println("Device registration sent");
}

void startRecording() {
  isRecording = true;
  sessionStartTime = millis();
  bufferIndex = 0;
  
  Serial.println("Started ECG recording for session: " + sessionId);
  blinkLED(2);
}

void stopRecording() {
  isRecording = false;
  
  // Send any remaining data in buffer
  if (bufferIndex > 0) {
    sendECGBatch();
  }
  
  sessionId = "";
  Serial.println("Stopped ECG recording");
  blinkLED(1);
}

void readECGData() {
  // Check if leads are connected
  bool leadsOff = digitalRead(LO_PLUS_PIN) == 1 || digitalRead(LO_MINUS_PIN) == 1;
  
  if (leadsOff) {
    Serial.println("Leads off detected!");
    return;
  }
  
  // Read ECG signal
  int rawValue = analogRead(ECG_OUTPUT_PIN);
  float voltage = (rawValue * VOLTAGE_REF) / ADC_RESOLUTION;
  
  // Convert to millivolts and apply basic filtering
  float voltageMV = (voltage - (VOLTAGE_REF / 2)) * 1000;
  
  // Calculate quality score based on signal characteristics
  float qualityScore = calculateQualityScore(voltageMV, leadsOff);
  
  // Store in buffer
  dataBuffer[bufferIndex].timestamp = millis() - sessionStartTime;
  dataBuffer[bufferIndex].voltage = voltageMV;
  dataBuffer[bufferIndex].leadsOff = leadsOff;
  dataBuffer[bufferIndex].qualityScore = qualityScore;
  
  bufferIndex++;
  
  // Send batch when buffer is full
  if (bufferIndex >= BATCH_SIZE) {
    sendECGBatch();
    bufferIndex = 0;
  }
  
  // Print to serial for debugging
  if (millis() % 1000 < SAMPLE_INTERVAL) { // Print once per second
    Serial.printf("ECG: %.3f mV, Quality: %.2f\n", voltageMV, qualityScore);
  }
}

void sendECGBatch() {
  DynamicJsonDocument doc(2048);
  JsonArray dataPoints = doc.createNestedArray("dataPoints");
  
  for (int i = 0; i < bufferIndex; i++) {
    JsonObject point = dataPoints.createNestedObject();
    point["timestamp"] = dataBuffer[i].timestamp;
    point["voltage"] = dataBuffer[i].voltage;
    point["qualityScore"] = dataBuffer[i].qualityScore;
    point["isArtifact"] = dataBuffer[i].leadsOff;
  }
  
  doc["sessionId"] = sessionId;
  doc["deviceId"] = deviceId;
  doc["batchSize"] = bufferIndex;
  
  String message;
  serializeJson(doc, message);
  
  webSocket.sendTXT("42[\"ecg-data\"," + message + "]");
  
  Serial.printf("Sent ECG batch: %d points\n", bufferIndex);
}

float calculateQualityScore(float voltage, bool leadsOff) {
  if (leadsOff) {
    return 0.0;
  }
  
  // Basic quality assessment
  float score = 1.0;
  
  // Penalize extreme voltages (likely noise)
  if (abs(voltage) > 5.0) {
    score -= 0.5;
  }
  
  // Penalize very low voltages (poor contact)
  if (abs(voltage) < 0.1) {
    score -= 0.3;
  }
  
  return max(0.0, score);
}

void sendHeartbeat() {
  batteryLevel = readBatteryLevel();
  
  DynamicJsonDocument doc(256);
  doc["deviceId"] = deviceId;
  doc["batteryLevel"] = batteryLevel;
  doc["firmwareVersion"] = "1.0.0";
  doc["isRecording"] = isRecording;
  doc["sessionId"] = sessionId;
  doc["wifiStrength"] = WiFi.RSSI();
  
  String message;
  serializeJson(doc, message);
  
  webSocket.sendTXT("42[\"device-status\"," + message + "]");
}

float readBatteryLevel() {
  // Read battery voltage if connected to GPIO39
  int rawBattery = analogRead(BATTERY_PIN);
  float batteryVoltage = (rawBattery * VOLTAGE_REF) / ADC_RESOLUTION;
  
  // Convert to percentage (assuming 3.0V = 0%, 4.2V = 100% for Li-ion)
  float percentage = ((batteryVoltage - 3.0) / 1.2) * 100;
  return constrain(percentage, 0, 100);
}

void handleSerialCommands() {
  if (Serial.available()) {
    String command = Serial.readStringUntil('\n');
    command.trim();
    
    if (command == "status") {
      printStatus();
    }
    else if (command == "test") {
      testECGReading();
    }
    else if (command == "calibrate") {
      calibrateDevice();
    }
    else if (command == "restart") {
      ESP.restart();
    }
    else {
      Serial.println("Available commands: status, test, calibrate, restart");
    }
  }
}

void printStatus() {
  Serial.println("\n=== Device Status ===");
  Serial.println("Device ID: " + deviceId);
  Serial.println("WiFi: " + String(WiFi.status() == WL_CONNECTED ? "Connected" : "Disconnected"));
  Serial.println("IP Address: " + WiFi.localIP().toString());
  Serial.println("WebSocket: " + String(webSocket.isConnected() ? "Connected" : "Disconnected"));
  Serial.println("Recording: " + String(isRecording ? "Yes" : "No"));
  Serial.println("Session ID: " + (sessionId != "" ? sessionId : "None"));
  Serial.println("Battery: " + String(batteryLevel) + "%");
  Serial.println("Free Heap: " + String(ESP.getFreeHeap()) + " bytes");
  Serial.println("===================\n");
}

void testECGReading() {
  Serial.println("Testing ECG reading for 10 seconds...");
  
  for (int i = 0; i < 10 * SAMPLE_RATE; i++) {
    bool leadsOff = digitalRead(LO_PLUS_PIN) == 1 || digitalRead(LO_MINUS_PIN) == 1;
    
    if (leadsOff) {
      Serial.println("Leads off!");
    } else {
      int rawValue = analogRead(ECG_OUTPUT_PIN);
      float voltage = (rawValue * VOLTAGE_REF) / ADC_RESOLUTION;
      float voltageMV = (voltage - (VOLTAGE_REF / 2)) * 1000;
      
      Serial.printf("Sample %d: Raw=%d, Voltage=%.3f mV\n", i, rawValue, voltageMV);
    }
    
    delay(SAMPLE_INTERVAL);
  }
  
  Serial.println("Test completed.");
}

void calibrateDevice() {
  Serial.println("Starting device calibration...");
  
  // Collect baseline readings
  float baseline = 0;
  int validSamples = 0;
  
  for (int i = 0; i < 100; i++) {
    bool leadsOff = digitalRead(LO_PLUS_PIN) == 1 || digitalRead(LO_MINUS_PIN) == 1;
    
    if (!leadsOff) {
      int rawValue = analogRead(ECG_OUTPUT_PIN);
      float voltage = (rawValue * VOLTAGE_REF) / ADC_RESOLUTION;
      baseline += voltage;
      validSamples++;
    }
    
    delay(10);
  }
  
  if (validSamples > 50) {
    baseline /= validSamples;
    Serial.printf("Calibration completed. Baseline: %.3f V\n", baseline);
  } else {
    Serial.println("Calibration failed - insufficient valid samples");
  }
}

void blinkLED(int times) {
  for (int i = 0; i < times; i++) {
    digitalWrite(LED_PIN, HIGH);
    delay(200);
    digitalWrite(LED_PIN, LOW);
    delay(200);
  }
}