function dataService($http) {
  this.request = function (query, hasTail) {
    var params = {};
    params['query[]'] = query || [];
    if (angular.isDefined(hasTail) && hasTail && params['query[]'].length) params.hasTail = true;
    return $http.get('/api/Data', {
      dataType: 'jsonp',
      params: params
    });
  };
}
module.exports = ['$http', dataService];