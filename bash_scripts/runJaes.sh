#!/bin/sh
set -x # show comands in execution

#which docker
docker ps -a

echo "Usuario actual: $(whoami)"
echo ____________________ PARADA
docker stop jaes-container
echo ____________________ BORRAR DOCKER
docker rm jaes-container
echo ____________________ BORRAR IMAGEN DOCKER
docker rmi jaes:latest
echo ____________________ CLONAR  NPM INSTALL
cd /home/jonbul/servers

CARPETA="jaes"

# Comprobar si existe
if [ -d "$CARPETA" ]; then
    cd jaes
    git fetch
    git pull
else
    rm -r -f jaes
    git clone git@github.com:jonbul/jaes.git
    cd jaes
fi
# git checkout cleaning


cp -f /home/jonbul/servers/files/.env /home/jonbul/servers/jaes/.env

echo ____________________ DESCARGAR DEPENDENCIAS
npm install
echo ____________________ NUEVO DOCKER
docker build -t jaes .


docker run -d -p 3000:3000 -p 3001:3001 --name jaes-container -v /home/jonbul/servers/files/ssl:/ssl jaes

# Mounts certs directly from the creation folder
# Mounts 'live' folder with symlinks which never changes the names
# To work inside the docker container mounts 'archive' folder with files

# docker run -d -p 3000:3000 -p 3001:3001 --name jaes-container \
#   -v /etc/letsencrypt/live/jonbul.ddns.net/:/ssl \
#   -v /etc/letsencrypt/archive/jonbul.ddns.net/:/etc/letsencrypt/archive/jonbul.ddns.net \
#   jaes



# docker compose up -d --build


docker ps -a
