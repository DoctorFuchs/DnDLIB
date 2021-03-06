git checkout docker-test
git pull

sudo ufw allow 80
sudo ufw allow http

python3 -m venv env
source env/bin/activate

if [ ! -d "/api" ]
then
    git clone https://github.com/5e-bits/5e-srd-api api
fi

cd api

# update
git pull
docker-compose pull

docker-compose up --build &

cd ..

pip3 install -r requirements.txt

python3 -m server --local true

deactivate
