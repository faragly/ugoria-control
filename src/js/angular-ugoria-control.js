(function(window, angular, jQuery) {
  'use strict';
  
  var templates = angular.module('templates', []);
  require('./templates');

  var myapp = angular.module('ngUgoriaControl', ['templates'])
  	.constant('MODULE_VERSION', '1.0')
  	.provider('options', require('./providers/options'))
  	.service('dataService', require('./services/data'))
  	.service('keysService', require('./services/keys'))
  	.directive('focus', require('./directives/focus'))
  	.directive('ugoriaControl', require('./directives/ugoria'))
  	.filter('filteredSegments', require('./filters/segments'))
  	.factory('ugoriaCache', require('./factories/cache'));
})(window, window.angular, window.jQuery);