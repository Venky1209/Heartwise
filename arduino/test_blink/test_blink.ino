/*
 * Simple ESP32 Blink Test
 * This will help verify if upload works at all
 */

void setup() {
  pinMode(2, OUTPUT); // Built-in LED
  Serial.begin(115200);
  delay(1000);
  Serial.println("ESP32 Blink Test - Upload Successful!");
}

void loop() {
  digitalWrite(2, HIGH);
  Serial.println("LED ON");
  delay(500);
  
  digitalWrite(2, LOW);
  Serial.println("LED OFF");
  delay(500);
}
