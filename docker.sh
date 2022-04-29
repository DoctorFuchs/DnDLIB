if [ ! -d "/5e-srd-api" ]
then
    git clone https://github.com/5e-bits/5e-srd-api
fi

if [ ! -d "/DNDLib" ]
then
    git clone https://github.com/doctorfuchs/DNDLib
fi

cd 5e-srd-api

# update
git pull
docker-compose pull

docker-compose up --build ?

cd ..
cd DNDLib

git pull

python3 -m server --local
