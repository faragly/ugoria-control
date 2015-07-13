function Vehicles($scope, $rootScope, $timeout, $filter, dataService, keysService) {
  var vm = $scope;
  vm.data = null;
  vm.hasTail = false;
  vm.dropdownVisible = false;
  vm.selected = {};
  vm.loading = false;

  var activeRequest = null,
    isFirstRequest = true;
  vm.keys = keysService;
  
  /*
  Функция обновления запроса, при пустых входных данных загружает /api/Data без параметров
  изменяя input каждый раз вызывается и соответственно если выбрать элемент BMW и начать удалять, то при BM содержимое selected обнулится
  немного доработан разбор строки, если вручную ввести bmw 3, то запрос уйдет /api/Data?query[]=bmw&query[]=3&hasTail=true, а не /api/Data?query[]=bmw%203&hasTail=true
  запросы отправляются не чаще чем каждые 250ms
  */
  vm.refresh = function(hasTail, query) {
    vm.hasTail = hasTail || false;
    query = query || vm.q;
    vm.loading = true;
    if (angular.isArray(vm.selected.segments) && vm.q.toLowerCase().indexOf(vm.selected.segments[0].toLowerCase()) === -1)
      vm.selected = {};
    else if (angular.isArray(vm.selected.segments) && vm.q.length > 0) {
      var str = angular.copy(vm.q);
      angular.forEach(vm.selected.segments, function(val) {
        str = str.replace(new RegExp(val, 'i'), '').trim();
      });
      if (str.length > 0)
        query = [vm.selected.segments[0], str];
    }
    if (angular.isString(query))
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
    }, 250);
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
    vm.q = elem.segments.join(' ');
    vm.refresh(vm.hasTail, elem.segments);
    jQuery('.dropdown.show > .inner').focus();
  };

  /* эта функция по сути не нужна, использовалась при первой загрузке, то же самое можно получить с помощью refresh() без параметров */
  /*
  vm.ajaxRequest = function() {
    vm.loading = true;
    $timeout(function() {
      dataService.request().then(function(dataResponse) {
        vm.data = dataResponse.data;
        vm.filteredSegments = $filter('filteredSegments')(vm.data);
        vm.loading = false;
      });
    }, 1000);
  };*/

  /* показываем диалог и позиционируем под input'ом */
  vm.showDropdown = function(event) {
    vm.dropdownVisible = true;
    var el = event.target;
    var position = jQuery(el).offset();
    jQuery('.dropdown').css({
      top: position.top + 35,
      left: position.left
    });
  };

  /*
  Здесь обрабатываем клики в документе, если клик сделан на выпадающем окне или в поле ввода, то не скрываем
  поддерживает несколько диалогов, если переместить фокус на не привязанный input, то окно скрывается
  */
  $rootScope.$on("documentClicked", function(inner, target) {
    var isDropdown = jQuery(target[0]).is(".dropdown.show") || jQuery(target[0]).parents(".dropdown.show").length > 0,
      isFocused = false;
    if (jQuery(target[0]).is(":focus")) {
      isFocused = '#' + jQuery(target[0]).attr('id') == jQuery('.dropdown.show').data('for-input');
    }
    if (!isDropdown && !isFocused) {
      vm.$apply(function() {
        vm.dropdownVisible = false;
      });
    }
  });
}
module.exports = ['$scope', '$rootScope', '$timeout', '$filter', 'dataService', 'keysService', Vehicles];