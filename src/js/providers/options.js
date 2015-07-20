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