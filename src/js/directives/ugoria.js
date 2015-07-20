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
      if (!(jQuery(e.target).closest(dropdownElem).is(dropdownElem) > 0 && jQuery(element).is(':focus'))) {
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