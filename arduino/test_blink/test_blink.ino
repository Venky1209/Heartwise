/*
 * Basic Blink Test - Minimal Code
 * Tests if ESP32 can boot and run simple code
 */

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n\nBOOT SUCCESSFUL\n");
  pinMode(13, OUTPUT);
}

void loop() {
  digitalWrite(13, HIGH);
  Serial.println("LED ON");
  delay(500);
  digitalWrite(13, LOW);
  Serial.println("LED OFF");
  delay(500);
}
