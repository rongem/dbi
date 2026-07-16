echo Updating global libraries
npm outdated -g
npm update -g
cd frontend
echo Updating @angular
ng update @angular/cli @angular/core
echo Updating other libraries
npm update
npm audit fix
npm version patch
npm install
npm outdated
ng build
cd ../backend/
echo Updating backend
npm update
npm audit fix
npm version patch
npm install
npm run test
npm outdated
echo Done!
read -n 1
