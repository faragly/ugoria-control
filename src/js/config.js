module.exports = ['$httpProvider', function ($httpProvider) {
  // устанавливаем url для запросов
  //optionsProvider.setRootUrl('/api/Data');
  
  $httpProvider.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded; charset=UTF-8';
  //$httpProvider.defaults.useXDomain = true;
  //$httpProvider.defaults.withCredentials = true;
  //delete $httpProvider.defaults.headers.common["X-Requested-With"];
  //$httpProvider.defaults.headers.common["Accept"] = "application/json";
  //$httpProvider.defaults.headers.common["Content-Type"] = "application/json";
  //console.log($httpProvider.defaults.headers);
  //$httpProvider.defaults.headers.common['Access-Control-Allow-Origin'] = '*';
  /**
  * The workhorse; converts an object to x-www-form-urlencoded serialization.
  * @param {Object} obj
  * @return {String}
  */ 
  var param = function(obj) {
    var query = '', name, value, fullSubName, subName, subValue, innerObj, i;

    for(name in obj) {
      value = obj[name];

      if(value instanceof Array) {
        for(i=0; i<value.length; ++i) {
          subValue = value[i];
          fullSubName = name + '[' + i + ']';
          innerObj = {};
          innerObj[fullSubName] = subValue;
          query += param(innerObj) + '&';
        }
      }
      else if(value instanceof Object) {
        for(subName in value) {
          subValue = value[subName];
          fullSubName = name + '[' + subName + ']';
          innerObj = {};
          innerObj[fullSubName] = subValue;
          query += param(innerObj) + '&';
        }
      }
      else if(value !== undefined && value !== null)
        query += encodeURIComponent(name) + '=' + encodeURIComponent(value) + '&';
    }

    return query.length ? query.substr(0, query.length - 1) : query;
  };

  // Override $http service's default transformRequest
  $httpProvider.defaults.transformRequest = [function(data) {
    return angular.isObject(data) && String(data) !== '[object File]' ? param(data) : data;
  }];
}];