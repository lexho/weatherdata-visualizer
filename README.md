# weatherdata-visualizer

## Description
visualizes weather data in the webbrowser coming from an Arduino weather station at the USB port

## Prerequisites
Node.js
```
sudo apt install nodejs
```

## Installation
```
npm install
```
## start
```
node index.js
```
watch weather data at http://localhost:8080

## install as systemd services
```
sudo systemctl daemon-reload
sudo systemctl enable weatherdb2
sudo systemctl start weatherdb2
```