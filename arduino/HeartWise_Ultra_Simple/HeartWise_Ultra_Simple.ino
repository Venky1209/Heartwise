/*
 * HeartWise ECG Monitor - Ultra Simple Version
 * Minimal code to avoid crashes
 */

const int ECG_PIN = 34;
const int LO_MINUS_PIN = 2;
const int LO_PLUS_PIN = 4;
const int LED_PIN = 13;

const int SAMPLE_RATE = 250;
const int SAMPLE_INTERVAL_MS = 4;
const float VOLTAGE_REF = 3.3;
const int ADC_MAX = 4095;

unsigned long lastSampleTime = 0;
int sampleCount = 0;

void setup() {
  Serial.begin(115200);
  delay(2000);
  
  pinMode(ECG_PIN, INPUT);
  pinMode(LO_MINUS_PIN, INPUT);
  pinMode(LO_PLUS_PIN, INPUT);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, HIGH);
  
  Serial.println("\n╔════════════════════════════════════════════╗");
  Serial.println("║   HeartWise ECG - Simple Version           ║");
  Serial.println("╚════════════════════════════════════════════╝\n");
  Serial.println("Setup complete!");
}

void loop() {
  unsigned long now = millis();
  if (now - lastSampleTime >= SAMPLE_INTERVAL_MS) {
    // Read pins
    int raw = analogRead(ECG_PIN);
    float voltage = (raw / (float)ADC_MAX) * VOLTAGE_REF;
    float voltageMV = (voltage - (VOLTAGE_REF / 2.0)) * 1000.0;
    int gpio2 = digitalRead(LO_MINUS_PIN);
    int gpio4 = digitalRead(LO_PLUS_PIN);
    bool leadsOff = (gpio2 == HIGH || gpio4 == HIGH);
    
    // Print JSON
    Serial.print("{\"raw\":");
    Serial.print(raw);
    Serial.print(",\"voltage\":");
    Serial.print(voltageMV);
    Serial.print(",\"gpio2\":");
    Serial.print(gpio2);
    Serial.print(",\"gpio4\":");
    Serial.print(gpio4);
    Serial.print(",\"leadsOff\":");
    Serial.print(leadsOff ? "true" : "false");
    Serial.println("}");
    
    // LED blink every 125 samples
    sampleCount++;
    if (sampleCount >= 125) {
      digitalWrite(LED_PIN, !digitalRead(LED_PIN));
      sampleCount = 0;
    }
    
    lastSampleTime = now;
  }
}
