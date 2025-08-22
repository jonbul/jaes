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


echo ____________________ DESCARGAR DEPENDENCIAS
npm install
echo ____________________ NUEVO DOCKER
docker build -t jaes .


docker run -d -p 3000:3000 -p 3001:3001 --name jaes-container -v /home/jonbul/servers/ssl:/files/ssl jaes



# docker compose up -d --build


docker ps -a
