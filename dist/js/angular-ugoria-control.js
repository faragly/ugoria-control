(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
},{"./directives/focus":2,"./directives/ugoria":3,"./factories/cache":4,"./filters/segments":5,"./providers/options":6,"./services/data":7,"./services/keys":8,"./templates":9}],2:[function(require,module,exports){
module.exports = ['$timeout', function ($timeout) {
  return {
    scope : {
      trigger : '@focus'
    },
    link : function(scope, element) {
      scope.$watch('trigger', function(value) {
        if (value === "true") {
          $timeout(function() {
            element[0].focus();
          });
        }
      });
    }
  };
}];
},{}],3:[function(require,module,exports){
function ugoriaControl($templateCache, $compile, $parse, $timeout, $filter, $rootScope, dataService, keysService, options) {
  var directive = {
    scope: {
      selected: '=ucSelected',
      text: '=ngModel'
    },
    restrict: 'EA',
    compile: function (){
      return {
        pre: link
      };
    },
    controller: UgoriaCtrl,
    controllerAs: 'uc',
    bindToController: true
  };
  return directive;

  function link(scope, element, attrs) {
    // var dropdownScope = scope.$new(true);
    element.on('focus', toggleVisibility.bind(null, true));
    element.on('keyup', refresh);
    
    var dropdownElem = angular.element($templateCache.get('dropdown.html'));
    element.after(dropdownElem);
    $compile(dropdownElem)(scope);
    angular.element(document).on("click", dropdownClicked);

    scope.$on('$destroy', function (){
      element.off('focus', toggleVisibility);
      element.off('keyup', refresh);
      angular.element(document).off("click", dropdownClicked);
      dropdownElem.remove();
    });
    
    // вызывается при событии keyup при вводе с клавиатуры
    function refresh(e) {
      scope.uc.refresh(true);
    }

    // вызывается при клике на документе, если клик не на dropdown или фокус не на текстовом поле, то скрываем dropdown
    function dropdownClicked(e) {
      if (jQuery(e.target).closest(dropdownElem).is(dropdownElem) === false && jQuery(element).is(':focus') === false) {
        toggleVisibility(false);
      }
    }

    // скрываем или показываем dropdown
    function toggleVisibility(visible){        
      scope.$emit('dropdown:show', visible);
      if(visible)
        scope.uc.showDropdown();
      scope.$apply();
    }
  }    
}

UgoriaCtrl.$inject = ['$scope', '$element', '$attrs', '$parse', '$filter', '$timeout', 'dataService', 'keysService', 'options'];
function UgoriaCtrl($scope, $element, $attrs, $parse, $filter, $timeout, dataService, keysService, options) {
  var vm = this;
  var cancel = $scope.$on('dropdown:show', show);
  vm.data = null;
  vm.hasTail = false;
  vm.dropdownVisible = false;
  vm.selected = {};
  vm.loading = false;
  var activeRequest = null,
    isFirstRequest = true;
  vm.keys = keysService;
      
  function show(evt, visible) {
    vm.dropdownVisible = visible;
  }

  /* показываем диалог и позиционируем под input'ом */
  vm.showDropdown = function() {
    var position = jQuery($element).offset();
    jQuery($element).next().css({
      top: position.top + jQuery($element).outerHeight(),
      left: position.left
    });
    vm.refresh(vm.hasTail);
  };

  /*
    Функция обновления запроса, при пустых входных данных загружает /api/Data без параметров
    изменяя input каждый раз вызывается и соответственно если выбрать элемент BMW и начать удалять, то при BM содержимое selected обнулится
    немного доработан разбор строки, если вручную ввести bmw 3, то запрос уйдет /api/Data?query[]=bmw&query[]=3&hasTail=true, а не /api/Data?query[]=bmw%203&hasTail=true
    запросы отправляются не чаще чем каждые 250ms
  */
  vm.refresh = function(hasTail, query) {
    var value = angular.copy(vm.text);
    vm.hasTail = hasTail || false;
    query = query || value;
    vm.loading = true;
    if (angular.isArray(vm.selected.segments) && value.toLowerCase().indexOf(vm.selected.segments[0].toLowerCase()) === -1)
      vm.selected = {};
    else if (angular.isArray(vm.selected.segments) && value.length > 0) {
      var str = angular.copy(value);
      angular.forEach(vm.selected.segments, function(val) {
        str = str.replace(new RegExp(val, 'i'), '').trim();
      });
      if (str.length > 0)
        query = [vm.selected.segments[0], str];
    }
    if (angular.isString(query) && query.length > 0)
      query = query.split(' ');
    if (activeRequest) $timeout.cancel(activeRequest);
    activeRequest = $timeout(function() {
      dataService.request(query, vm.hasTail).then(function(dataResponse) {
        vm.data = dataResponse.data;
        if(isFirstRequest) {
          vm.filteredSegments = $filter('filteredSegments')(vm.data);
          isFirstRequest = false;
        }
        vm.loading = false;
      });
    }, options.getRequestInterval());
  };

  /* выбираем элемент, если он с ID то скрываем dropdown окно */
  vm.select = function(elem) {
    if (angular.isString(elem)) {
      elem = {
        segments: [elem]
      };
    }
    if (elem.id > 0 && elem.segments.length > 1)
      vm.dropdownVisible = false;
    vm.hasTail = false;
    vm.selected = elem;
    vm.text = elem.segments.join(' ');
    angular.element($element).val(elem.segments.join(' '));
    vm.refresh(vm.hasTail, elem.segments);
    jQuery($element).next().children('.inner').focus();
  };
}

module.exports = ['$templateCache', '$compile', '$parse', '$timeout', '$filter', '$rootScope', 'dataService', 'keysService', ugoriaControl];
},{}],4:[function(require,module,exports){
function UgoriaCache($cacheFactory) {
  return $cacheFactory('ugoriaCache', {capacity: 10});
}

module.exports = ['$cacheFactory', UgoriaCache];
},{}],5:[function(require,module,exports){
function filteredSegments() {
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
}

module.exports = [filteredSegments];
},{}],6:[function(require,module,exports){
function options() {
  var rootUrl = 'http://phwebpro.azurewebsites.net/api/Data',
    requestInterval = 250;
  this.setRootUrl = function(url) {
    rootUrl = url;
    return this; // Fluent interface, тут к месту.
  };     
  this.setRequestInterval = function(interval) {
    requestInterval = interval;
    return this;
  };     
  this.$get = function() {
    return {
      getRequestInterval: function() { return requestInterval; },
      getRootUrl: function() { return rootUrl; }
    };
  };
}

module.exports = [options];
},{}],7:[function(require,module,exports){
function dataService($http, $httpParamSerializer, ugoriaCache, options) {
  this.request = function (query, hasTail) {
    var result,
      params = {};
    params['query[]'] = query || [];
    if (angular.isDefined(hasTail) && hasTail && params['query[]'].length) params.hasTail = true;
    //console.log($httpParamSerializer(params));
    var serializedParams = $httpParamSerializer(params);
    if(ugoriaCache.get(serializedParams)) {
      result = ugoriaCache.get(serializedParams);
      console.log('Запрос не выполнен, данные взяты из кэша.');
    } else {
      result = $http.get(options.getRootUrl(), {
        dataType: 'jsonp',
        params: params 
      });
      ugoriaCache.put(serializedParams, result);
      console.log('Запрос выполнен, данные помещены в кэш.');
    }
    return result;
  };
}

module.exports = ['$http', '$httpParamSerializer', 'ugoriaCache', 'options', dataService];
},{}],8:[function(require,module,exports){
function keysService() {
  var service = {
    arrows: arrows
  };
  return service;

  /* функция нажатия стрелок вверх вниз влево вправо
  * что поддерживается:
  * перемещение из конца одной колонки в начало следующей (вниз)
  * из конца последней в начало первой (вниз)
  * из начала одной колонки в конец предыдущей (вверх)
  * из начала первой колонки в конец последней (вверх)
  * вправо влево попроще, так как элементы выстраиваются горизонтально, то есть достаточно перехода к предыдущему или следующему элементу набора
  * во всех случаях корректируется положение скроллинга, так чтобы фокусируемый элемент был в зоне видимости
  */
  function arrows(event) {
    var items = jQuery('.dropdown.show .content > .flex-container > .item:visible'),
      item = items.parent().find('.item:has(a:focus)').length ? items.parent().find('.item:has(a:focus)') : event.keyCode == 40 ? items.last() : items.first(),
      inner = jQuery('.dropdown.show > .inner'),
      scrollTop = inner.scrollTop(),
      arr = [],
      el;
    switch (event.keyCode) {
    case 40:
      var isLastInColumn = true;
      arr = items.slice(item.index() + 1);
      if (item.index() == items.length - 1) {
        items.first().children('a').focus();
        inner.scrollTop(0);
      }
      jQuery.each(arr, function (index, element) {
        el = jQuery(element);
        if (el.position().left == item.position().left) {
          el.children('a').focus();
          if (el.position().top + el.outerHeight() > inner.height()) inner.scrollTop(scrollTop + el.outerHeight());
          isLastInColumn = false;
          return false;
        }
      });
      if (arr.length && isLastInColumn) {
        el = jQuery(items.get((item.index() % totalColumns(items.slice(0, 10))) + 1));
        el.children('a').focus();
        if (el.position().top + el.outerHeight() < 0) inner.scrollTop(0);
      }
      event.preventDefault();
      break;
    case 38:
      var isFirstInColumn = true;
      arr = items.slice(0, item.index());
      if (item.index() === 0) {
        el = items.last();
        el.children('a').focus();
        if (el.position().top < 0) inner.scrollTop(scrollTop + el.position().top - el.outerHeight());
      }
      jQuery.each(arr.get().reverse(), function (index, element) {
        el = jQuery(element);
        if (el.position().left == item.position().left) {
          el.children('a').focus();
          var scrollTop = inner.scrollTop();
          if (el.position().top < 0) inner.scrollTop(scrollTop + el.position().top - el.outerHeight());
          isFirstInColumn = false;
          return false;
        }
      });
      if (arr.length && isFirstInColumn) {
        var i = getLastItemInCoulmn(items, item.index() % totalColumns(items.slice(0, 10)));
        el = jQuery(items.get(i));
        el.children('a').focus();
        if (el.position().top + el.outerHeight() > inner.height()) inner.scrollTop(el.position().top + el.outerHeight());
      }
      event.preventDefault();
      break;
    case 37:
      el = item.index() === 0 ? items.last() : item.prev();
      el.children('a').focus();
      if (el.position().top + el.outerHeight() > inner.height()) {
        inner.scrollTop(scrollTop + el.position().top + el.outerHeight());
      } else if (el.position().top < 0) inner.scrollTop(scrollTop - el.outerHeight());
      break;
    case 39:
      el = item.index() == items.length - 1 ? items.first() : item.next();
      el.children('a').focus();
      if (el.position().top + el.outerHeight() > inner.height()) inner.scrollTop(scrollTop + el.outerHeight());
      else if (el.position().top < 0) inner.scrollTop(0);
      break;
    }
  }

  // функция высчитывает количество колонок
  function totalColumns(items) {
    var num = 0,
      firstElemPositionLeft = null;
    jQuery.each(items, function (index, element) {
      el = jQuery(element);
      if (index === 0) firstElemPositionLeft = el.position().left;
      if (el.position().left == firstElemPositionLeft && index) {
        return false;
      }
      num++;
    });
    return num;
  }

  // функция возвращает индекс последнего элемента в колонке col
  function getLastItemInCoulmn(items, col) {
    var i = 0,
      colElemPositionLeft = jQuery(items.get(col - 1)).position().left;
    jQuery.each(items, function (index, element) {
      if (jQuery(element).position().left == colElemPositionLeft) i = index;
    });
    return i;
  }
}
module.exports = [keysService];
},{}],9:[function(require,module,exports){
'use strict'; module.exports = angular.module("templates").run(["$templateCache", function($templateCache) {$templateCache.put("dropdown.html","\n<div ng-class=\"{show: uc.dropdownVisible}\" class=\"dropdown bottom\">\n  <div tabindex=\"0\" ng-keydown=\"uc.keys.arrows($event)\" class=\"inner\">\n    <div class=\"dropdown-content\">\n      <div class=\"flex-container\">\n        <div ng-if=\"uc.loading\" role=\"spinner\" class=\"spinner\">\n          <div class=\"spinner-icon\"></div>\n        </div>\n        <nav ng-hide=\"!((uc.selected.segments[0] &amp;&amp; uc.hasTail) || uc.text.length)\" class=\"tabs-left\">\n          <ul class=\"nav nav-tabs\">\n            <li ng-repeat=\"item in uc.filteredSegments track by $index\" ng-class=\"{active: item == uc.selected.segments[0]}\"><a href=\"#\" ng-click=\"item != uc.selected.segments[0] ? uc.select(item) : null\">{{item}}</a></li>\n          </ul>\n        </nav>\n        <div class=\"content clearfix\">\n          <div ng-hide=\"uc.loading\" class=\"flex-container\"> \n            <div ng-if=\"!uc.data.length\">Ничего не найдено.</div>\n            <div ng-repeat=\"elem in uc.data track by $index\" ng-hide=\"elem.id === null &amp;&amp; uc.selected.segments.length &lt; 2\" class=\"item\"> <a href=\"#\" ng-click=\"uc.select(elem)\" tabindex=\"{{$index+1}}\">{{elem.id ? elem.segments[1] : elem.segments[0]}}</a>\n            </div>\n          </div>\n        </div>\n      </div>\n    </div>\n  </div>\n</div>");}]);
},{}]},{},[1]);
