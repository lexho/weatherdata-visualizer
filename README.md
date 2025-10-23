# weatherdata-visualizer

## Description
visualizes weather data in the webbrowser coming from an Arduino weather station at the USB port
<img width="1024" height="549" alt="weatherstation-gui" src="https://github.com/user-attachments/assets/433fbd01-0e18-49e0-8242-955883e3c7d7" />

## Prerequisites
Node.js
```
sudo apt install nodejs
```

## Installation
```
npm install
cd angular_frontend
ng build
cp dist/angular_svg/browser/ ../public/
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
