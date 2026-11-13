
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <ESP32Servo.h>


const char* ssid = "YOU_NetName";
const char* password = "YOU_Passwd";
const char* servidor = "http://192.0.0.0:3000/comando";


#define PIN_OMBRO 18
#define PIN_COTOVELO 19
#define PIN_MAO 21

Servo servoOmbro;
Servo servoCotovelo;
Servo servoMao;

void conectarWiFi() {
    WiFi.begin(ssid, password);
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }
    Serial.println("Wi-Fi conectado!");
    Serial.print("IP do ESP32: ");
    Serial.println(WiFi.localIP());
}


void executarComando(int shoulder,int elbow,int hand) {
    // Limite de seguranca inicial
    shoulder= constrain(shoulder, 0, 180);
    elbow= constrain(elbow,10,160);
    hand=constrain(hand,0,180);
    servoOmbro.write(shoulder);
    servoCotovelo.write(elbow);
    servoMao.write(hand);
}


void consultarServidor() {
    HTTPClient http;
    http.begin(servidor);
    int codigo = http.GET();
    if (codigo == HTTP_CODE_OK) {
        String resposta = http.getString();
        JsonDocument doc;
        DeserializationError erro = deserializeJson(doc, resposta);
        if (erro) {
            Serial.println("Erro ao interpretar JSON");
            http.end();
            return;
        }

        int angleS = doc["angleS"];
        int angleE = doc["angleE"];
        int angleH = doc["angleH"];

        if (!doc["angleS"].is<int>() || !doc["angleE"].is<int>() || !doc["angleH"].is<int>()) {
            Serial.println("JSON invalido");
            http.end();
            return;

        }
        Serial.println("--------------------");
        Serial.print("S: ");
        Serial.println(angleS);
        Serial.print("E: ");
        Serial.println(angleE);
        Serial.print("H: ");
        Serial.println(angleH);
        executarComando(angleS,angleE,angleH);
    }

    else {
        Serial.print("Erro HTTP: ");
        Serial.println(codigo);
        if (codigo < 0) {
            Serial.println(http.errorToString(codigo));
        }

    }
    http.end();
}


void setup() {

    Serial.begin(115200);

    // Inicializa servos
    servoOmbro.setPeriodHertz(50);
    servoCotovelo.setPeriodHertz(50);
    servoMao.setPeriodHertz(50);

    servoOmbro.attach(PIN_OMBRO, 500, 2400);
    servoCotovelo.attach(PIN_COTOVELO, 500, 2400);
    servoMao.attach(PIN_MAO, 500, 2400);


    servoOmbro.write(90);
    servoCotovelo.write(90);
    servoMao.write(90);

    conectarWiFi();
    

}

void loop() {
    if (WiFi.status() == WL_CONNECTED) {
        consultarServidor();
    }

    else {
        Serial.println("Wi-Fi desconectado!");
        conectarWiFi();
    }

    delay(500);

}
