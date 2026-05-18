/*
 * HeartWise ECG Monitor - Simple USB Serial Version
 * 
 * Hardware Connections:
 * - AD8232 OUTPUT -> ESP32 GPIO34 (D34)
 * - AD8232 LO-    -> ESP32 GPIO2  (D2)
 * - AD8232 LO+    -> ESP32 GPIO4  (D4)
 * - AD8232 3.3V   -> ESP32 3.3V
 * - AD8232 GND    -> ESP32 GND
 */

// Pin definitions
const int ECG_PIN = 34;      // AD8232 OUTPUT
const int LO_MINUS_PIN = 2;  // AD8232 LO- (lead detection)
const int LO_PLUS_PIN = 4;   // AD8232 LO+ (lead detection)
const int LED_PIN = 13;      // Status LED

// ECG sampling
const int SAMPLE_RATE = 250;  // 250 Hz
const int SAMPLE_INTERVAL_MS = 1000 / SAMPLE_RATE;  // 4ms

// Voltage conversion
const float VOLTAGE_REF = 3.3;
const int ADC_MAX = 4095;

// Timing
unsigned long lastSampleTime = 0;
unsigned long lastPrintTime = 0;
int sampleCount = 0;

void setup() {
  Serial.begin(115200);
  delay(2000);
  
  // Setup pins
  pinMode(ECG_PIN, INPUT);
  pinMode(LO_MINUS_PIN, INPUT);
  pinMode(LO_PLUS_PIN, INPUT);
  pinMode(LED_PIN, OUTPUT);
  
  printBanner();
  
  Serial.println("✅ Setup complete! Reading ECG data...\n");
}

void loop() {
  // Sample at precise intervals
  unsigned long now = millis();
  if (now - lastSampleTime >= SAMPLE_INTERVAL_MS) {
    readECG();
    lastSampleTime = now;
  }
  
  // Print status every 5 seconds
  if (now - lastPrintTime >= 5000) {
    printStats();
    lastPrintTime = now;
  }
}

void readECG() {
  // Read ADC value from ECG pin
  int rawADC = analogRead(ECG_PIN);
  
  // Convert to voltage (0-3.3V)
  float voltage = (rawADC / (float)ADC_MAX) * VOLTAGE_REF;
  
  // Convert to mV centered at 0 (±1650mV)
  float voltageMV = (voltage - (VOLTAGE_REF / 2.0)) * 1000.0;
  
  // Read lead detection pins
  int gpio2 = digitalRead(LO_MINUS_PIN);
  int gpio4 = digitalRead(LO_PLUS_PIN);
  bool leadsOff = (gpio2 == HIGH || gpio4 == HIGH);
  
  // Create JSON output
  Serial.print("{\"raw\":");
  Serial.print(rawADC);
  Serial.print(",\"voltage\":");
  Serial.print(voltageMV, 2);
  Serial.print(",\"gpio2\":");
  Serial.print(gpio2);
  Serial.print(",\"gpio4\":");
  Serial.print(gpio4);
  Serial.print(",\"leadsOff\":");
  Serial.print(leadsOff ? "true" : "false");
  Serial.println("}");
  
  // LED feedback - blink every 125 samples (0.5 sec at 250Hz)
  sampleCount++;
  if (sampleCount >= 125) {
    digitalWrite(LED_PIN, !digitalRead(LED_PIN));
    sampleCount = 0;
  }
}

void printStats() {
  Serial.println("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  Serial.println("📊 ECG Monitor Status");
  Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  Serial.println("Pin Configuration:");
  Serial.println("  GPIO34: ECG OUTPUT (Voltage)");
  Serial.println("  GPIO2:  LO- (Lead Detection)");
  Serial.println("  GPIO4:  LO+ (Lead Detection)");
  Serial.println("\nSampling: 250 Hz");
  Serial.println("Data Format: JSON (one line per sample)");
  Serial.println("\nExample output:");
  Serial.println("{\"raw\":2048,\"voltage\":0.00,\"gpio2\":0,\"gpio4\":0,\"leadsOff\":false}");
  Serial.println("\nInterpretation:");
  Serial.println("  • voltage near 0mV + leadsOff=false → Good ECG signal");
  Serial.println("  • voltage = -1650mV + leadsOff=true → Pads not attached");
  Serial.println("  • voltage stuck at one value → Check pad contact");
  Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

void printBanner() {
  Serial.println();
  Serial.println("╔════════════════════════════════════════════╗");
  Serial.println("║   HeartWise ECG Monitor - Simple Version   ║");
  Serial.println("║   D34=ECG | D2=LO- | D4=LO+ | D13=LED     ║");
  Serial.println("╚════════════════════════════════════════════╝");
  Serial.println();
}
