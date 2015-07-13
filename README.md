### Как запустить приложение?
1. установить [Node.JS](https://nodejs.org/)
2. установить [Bower](http://bower.io/#install-bower) 
```	npm install -g bower	``` 
3. установить [GulpJS](http://gulpjs.com/)
```	npm install -g gulp	```
4. Склонировать репозиторий
```git clone https://github.com/faragly/ugoria-control.git```
5. Перейти в папку, куда клонировали репозиторий и выполнить последовательно
```
bower install
npm install
```
и уже можно запускать сборщик:
```
gulp
```

### Почему не работает если запустить index.html?
Сервис, с которого приложение получается данные (http://phwebpro.azurewebsites.net/api), не отдает заголовка 
```
'Access-Control-Allow-Origin': '*'
```
**CORS** не позволяет нам общаться с удаленным сервисом посредством ajax-запросов из-за соображений безопасности, поэтому в проекте используется проксирование запросов с локалхоста при помощи gulp-плагина ([http-proxy-middleware](https://www.npmjs.com/package/http-proxy-middleware)).

 