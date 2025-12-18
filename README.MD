# Yee!
[Production Version](https://jonbul.ddns.net/game )

# CERTS

During configuration port 80 must be direct to server, no port redirection and totally free and unused

sudo apt install certbot python3-certbot-nginx -y
sudo certbot certonly --standalone -d jonbul.ddns.net

# Android pair for chrome debugging

In pc
Install adb on your computer
```bash
sudo apt install adb -y
``` 

In Android
-Enable Wireless Debugging in android device
-- Remember the ip:port that appears in that screen for last step
-Tap on pair device with pairing code

In linux pc terminal run
```bash
adb pair ip_address:port
```

then insert the pairing code

then run with the IP seen in the previous screen
```bash
adb connect ip_address:port
```
