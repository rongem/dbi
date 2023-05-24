if [ "$1" == "-g" ]; then
	echo Updating global libraries
	npm update --location=global
fi
cd frontend
echo Updating @angular
ng update @angular/cli @angular/core @ngrx/store
echo Updating other libraries
npm update
npm audit fix
grunt bump
npm install
npm outdated
ng build
cd ../backend/
echo Updating backend
npm update
npm audit fix
grunt bump
npm install
npm run test
npm outdated
read -n 1
