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