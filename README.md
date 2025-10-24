# weatherdata-visualizer

## Description
visualizes weather data in the webbrowser coming from an Arduino weather station at the USB port

<img width="1024" height="549" alt="weatherstation-gui" src="https://github.com/user-attachments/assets/bbec131e-0641-421a-810c-9a6b27ab8a7b" />

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
sudo cp ./systemd/*.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable ttyperm.service
sudo systemctl enable weatherdb2.service
sudo systemctl start weatherdb2
```

## install udev rules
```
sudo cp ./udev/*.rules /etc/udev/rules.d/
```