#include <Wire.h>
#include <WiFi.h>
#include <DHT.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <WebServer.h>

// DHT11 Setup
#define DHTPIN 4
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

// MPU6050 Setup
Adafruit_MPU6050 mpu;

// Vibration Sensor Setup
#define VIBRATION_PIN 5

// Buzzer (Optional)
#define BUZZER_PIN 15

// Wi-Fi Credentials
const char* ssid = "STEM19EE";
const char* password = "1919016111@H";

// Threshold Values
float tempThreshold = 30.0;    // Temperature in °C
float pitchThreshold = 30.0;  // Pitch angle in degrees
float rollThreshold = 30.0;   // Roll angle in degrees

// Web Server
WebServer server(80);

// Initialize Sensors and Buzzer
void initSensors() {
  dht.begin();
  if (!mpu.begin()) {
    Serial.println("Failed to initialize MPU6050!");
    while (1);
  }
  mpu.setAccelerometerRange(MPU6050_RANGE_2_G);
  mpu.setGyroRange(MPU6050_RANGE_250_DEG);
  pinMode(VIBRATION_PIN, INPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);
}

// Fetch Sensor Data
String getSensorDataJson() {
  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();
  bool vibrationDetected = digitalRead(VIBRATION_PIN);

  sensors_event_t a, g, temp;
  mpu.getEvent(&a, &g, &temp);
  float pitch = atan2(a.acceleration.y, sqrt(a.acceleration.x * a.acceleration.x + a.acceleration.z * a.acceleration.z)) * 180.0 / PI;
  float roll = atan2(a.acceleration.x, sqrt(a.acceleration.y * a.acceleration.y + a.acceleration.z * a.acceleration.z)) * 180.0 / PI;

  bool thresholdExceeded = (temperature > tempThreshold || abs(pitch) > pitchThreshold || abs(roll) > rollThreshold);

  // Activate buzzer if threshold exceeded
  digitalWrite(BUZZER_PIN, thresholdExceeded ? HIGH : LOW);

  // Print readings to Serial Monitor
  Serial.println("==== Sensor Readings ====");
  Serial.print("Temperature: ");
  Serial.print(temperature, 1);
  Serial.println(" °C");
  
  Serial.print("Humidity: ");
  Serial.print(humidity, 1);
  Serial.println(" %");
  
  Serial.print("Pitch: ");
  Serial.print(pitch, 1);
  Serial.println(" °");
  
  Serial.print("Roll: ");
  Serial.print(roll, 1);
  Serial.println(" °");
  
  Serial.print("Vibration Detected: ");
  Serial.println(vibrationDetected ? "Yes" : "No");
  
  Serial.print("Threshold Exceeded: ");
  Serial.println(thresholdExceeded ? "Yes" : "No");
  Serial.println("========================");

  // Generate JSON string for web server
  String json = "{";
  json += "\"temperature\": " + String(temperature, 1) + ",";
  json += "\"humidity\": " + String(humidity, 1) + ",";
  json += "\"pitch\": " + String(pitch, 1) + ",";
  json += "\"roll\": " + String(roll, 1) + ",";
  json += "\"vibration\": " + String(vibrationDetected ? "true" : "false") + ",";
  json += "\"thresholdExceeded\": " + String(thresholdExceeded ? "true" : "false");
  json += "}";

  return json;
}

// Serve Sensor Data
void handleSensorData() {
  String data = getSensorDataJson();
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.send(200, "application/json", data);
}

// Wi-Fi Connection
void connectToWiFi() {
  WiFi.begin(ssid, password);
  Serial.print("Connecting to Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.print(".");
  }
  Serial.println("\nConnected to Wi-Fi!");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());
}

// Start Web Server
void startServer() {
  server.on("/data", handleSensorData);
  server.begin();
  Serial.println("Web Server started");
}

void setup() {
  Serial.begin(115200);
  
  connectToWiFi();
  initSensors();
  startServer();
}

void loop() {
  server.handleClient();
}
