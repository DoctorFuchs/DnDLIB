python3 -m venv env
cd /env/bin
source activate

cd ..
cd ..

if [ ! -d "/5e-srd-api" ]
then
    git clone https://github.com/5e-bits/5e-srd-api api
fi

cd api

# update
git pull
docker-compose pull

docker-compose up --build &

cd ..

git checkout docker-test
git pull

pip3 install -r requirements.txt

python3 -m server --local true

deactivate
