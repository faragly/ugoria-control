## angular-ugoria-control
----------
### AngularJS модуль
В данной ветке представлен angular модуль на базе тестового задания из ветки master. Весь функционал находится в файле модуля **/dist/js/angular-ugoria-control.min.js** (не забывайте также подключать файл стилей **/dist/css/styles.min.css**).

### Что нового?

 1. Функционал вынесен в модуль, имеет базовые настройки, задаваемые из вашего приложения
 2. Кэширование запросов на базе `$cacheFactory`. Теперь одни и те же запросы не будут выполняться повторно
 3. Убрана зависимость от `bootstrap`, используется reset.css от [Marx](https://github.com/mblode/marx)
 4. Валидная HTML разметка
 5. [БЭМ](https://ru.bem.info/tools/bem/bem-naming/) именование классов 

### Настройки модуля
Модуль имеет всего 2 настройки:

 1. URL для запроса *string* `rootUrl` (по умолчанию `'http://phwebpro.azurewebsites.net/api/Data'`), устанавливается с помощью `setRootUrl(url)`
 2. Интервал между запросами *integer* `requestInterval` (по умолчанию `250`), устанавливается с помощью `setRequestInterval(interval)`

Эти настройки можно задать в `.config()`, подключив провайдер модуля `optionsProvider`:

    // подключаем наш модуль
    var app = angular.module('myapp', ['ngUgoriaControl']);
	    app.config(['optionsProvider', function(optionsProvider) {
        // можем задать другой url
        optionsProvider.setRootUrl('/api/Data');
        // задаем время между запросами
        optionsProvider.setRequestInterval(1000);
      }]);

 Далее в html разметке подключается директива к вашему текстовому input полю:
 

    <input type="text" data-ng-model="query" data-ugoria-control data-uc-selected="selected" placeholder="Транспортное средство">

Префикс data- используется для прохождения [валидации](https://validator.w3.org).
    Данные выбора пользователя сохраняются в переменную `uc-selected`, в примере выше выбор пользователя будет доступен в переменной `$scope.selected`. Вы можете посмотреть код полностью на странице `/public/demo.html`.