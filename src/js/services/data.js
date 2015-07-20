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