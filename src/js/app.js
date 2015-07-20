(function() {
  'use strict';

  var angular = require('angular');
  window.$ = window.jQuery = require('jquery');

  require('./angular-ugoria-control');
  var app = angular.module('vehicles', ['ngUgoriaControl']);
  app.config(require('./config.js'));
  app.controller('TestCtrl', require('./controllers/test'));
})();