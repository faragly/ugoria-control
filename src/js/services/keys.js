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