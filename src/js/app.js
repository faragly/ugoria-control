/*
CORS не позволяет нам общаться с удаленным сервисом посредством 
ajax-запросов из-за соображений безопасности, если только сервер 
не отдает header с заголовком 'Access-Control-Allow-Origin': '*',
поэтому я использую проксирование запросов с локалхоста при помощи gulp-плагина
другое решение - использовать средства Apache и прописать:

# Proxy for BaseServer
<LocationMatch "/api">
   ProxyPass http://remote-server.com:8000/api/
   Header add "Access-Control-Allow-Origin" "*"
</LocationMatch>

Так как сервер browserSync не на апаче, то я выбрал прокси, смотрите gulpfile.coffee
*/
(function() {
  'use strict';

  var angular = require('angular');
  window.$ = window.jQuery = require('jquery');
  var app = angular.module('vehicles', []);
  app.config(require('./config.js'));
  app.controller('VehiclesCtrl', require('./controllers/vehicles'));
  app.service('dataService', require('./services/data'));
  app.service('keysService', require('./services/keys'));
  app.directive('focus', require('./directives/focus'));
  app.filter('filteredSegments', function() {
    return function(items, name) {
      var filtered = [];
      name = name || '';
      angular.forEach(items, function(item) {
        if(angular.isUndefined(item.id) || item.id === null){
          filtered.push(item.segments[0]);
        }
      });
      return filtered;
    };
  });
  app.run(['$rootScope', function($rootScope) {
      angular.element(document).on("click", function(e) {
        $rootScope.$broadcast("documentClicked", angular.element(e.target));
      });
    }]);
})();