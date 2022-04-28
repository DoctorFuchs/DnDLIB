[! -d "5e-srd-api"] && git clone https://github.com/5e-bits/5e-srd-api
[! -d "DnDLib"] && git clone https://github.com/doctorfuchs/DNDLib

cd 5e-srd-api

# update
git fetch --all
git reset --hard origin/branch
docker-compose pull

docker-compose up --build

cd ..
cd DnDLib

python3 -m server --local
