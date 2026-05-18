/*
 * HeartWise ECG - Minimal Bootup Version
 */

const int ECG_PIN = 34;
const int LO_MINUS_PIN = 2;
const int LO_PLUS_PIN = 4;
const int LED_PIN = 13;

unsigned long lastTime = 0;
int ledState = 0;
int count = 0;

void setup() {
  pinMode(LED_PIN, OUTPUT);
  pinMode(ECG_PIN, INPUT);
  pinMode(LO_MINUS_PIN, INPUT);
  pinMode(LO_PLUS_PIN, INPUT);
  
  digitalWrite(LED_PIN, HIGH);
  delay(500);
  digitalWrite(LED_PIN, LOW);
  delay(500);
  digitalWrite(LED_PIN, HIGH);
  
  Serial.begin(115200);
}

void loop() {
  unsigned long now = micros();
  
  if (now - lastTime >= 4000) {  // 4ms = 250Hz
    int raw = analogRead(ECG_PIN);
    float v = (raw * 3.3 / 4095.0 - 1.65) * 1000.0;
    int g2 = digitalRead(LO_MINUS_PIN);
    int g4 = digitalRead(LO_PLUS_PIN);
    
    Serial.print("{\"raw\":");
    Serial.print(raw);
    Serial.print(",\"v\":");
    Serial.print((int)v);
    Serial.print(",\"g2\":");
    Serial.print(g2);
    Serial.print(",\"g4\":");
    Serial.print(g4);
    Serial.println("}");
    
    count++;
    if (count >= 125) {
      ledState = !ledState;
      digitalWrite(LED_PIN, ledState);
      count = 0;
    }
    
    lastTime = now;
  }
}
