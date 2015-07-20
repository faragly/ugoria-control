function UgoriaCache($cacheFactory) {
  return $cacheFactory('ugoriaCache', {capacity: 10});
}

module.exports = ['$cacheFactory', UgoriaCache];