/* ===========================================================
 * onepagescroll.js v1.2.2
 * ===========================================================
 * Copyright 2014 Pete Rojwongsuriya.
 * http://www.thepetedesign.com
 *
 * Create an Apple-like website that let user scroll
 * one page at a time
 *
 * Credit: Eike Send for the awesome swipe event
 * https://github.com/peachananr/purejs-onepage-scroll
 *
 * License: GPL v3
 *
 * ========================================================== */
var onePageScroll = (function() {

  'use strict';

  var ops = {},
    defaults = {
      sectionContainer: "section",
      easing: "ease",
      animationTime: 1000,
      pagination: true,
      updateURL: false,
      keyboard: true,
      beforeMove: null,
      afterMove: null,
      loop: false,
      responsiveFallback: false
    },
    _root = this,
    settings,
    el,
    sections,
    total,
    status = "off",
    blockMove = false,
    topPos = 0,
    lastAnimation = 0,
    quietPeriod = 500,
    paginationList = "",
    body = document.querySelector("body");

  ops.init = function(element, options) {
    /*-------------------------------------------*/
    /*  Prepare Everything                       */
    /*-------------------------------------------*/

    el = document.querySelector(element),
      settings = Object.extend({}, defaults, options),
      sections = document.querySelectorAll(settings.sectionContainer),
      total = sections.length;

    _addClass(el, "onepage-wrapper")
    el.style.position = "relative";

    for (var i = 0; i < sections.length; i++) {
      _addClass(sections[i], "ops-section")
      sections[i].dataset.index = i + 1;
      topPos = topPos + 100;

      if (settings.pagination == true) {
        paginationList += "<li><a data-index='" + (i + 1) + "' href='#" + (i + 1) + "'></a></li>";
      }
    }

    _swipeEvents(el);
    document.addEventListener("swipeDown", function(event) {
      if (!_hasClass(body, "disabled-onepage-scroll")) event.preventDefault();
      ops.moveUp(el);
    });
    document.addEventListener("swipeUp", function(event) {
      if (!_hasClass(body, "disabled-onepage-scroll")) event.preventDefault();
      ops.moveDown(el);
    });

    // Create Pagination and Display Them
    if (settings.pagination == true) {
      var pagination = document.createElement("ul");
      pagination.setAttribute("class", "onepage-pagination");

      body.appendChild(pagination)
      pagination.innerHTML = paginationList;
      var posTop = (document.querySelector(".onepage-pagination").offsetHeight / 2) * -1;
      document.querySelector(".onepage-pagination").style.marginTop = posTop;
    }

    //upade URL
    if (window.location.hash != "" && window.location.hash != "#1") {
      var init_index = window.location.hash.replace("#", ""),
        next = document.querySelector(settings.sectionContainer + "[data-index='" + (init_index) + "']"),
        next_index = next.dataset.index;

      _addClass(document.querySelector(settings.sectionContainer + "[data-index='" + init_index + "']"), "active")
      _addClass(body, "viewing-page-" + init_index)
      if (settings.pagination == true) _addClass(document.querySelector(".onepage-pagination li a" + "[data-index='" + init_index + "']"), "active");

      if (next) {
        _addClass(next, "active")
        if (settings.pagination == true) _addClass(document.querySelector(".onepage-pagination li a" + "[data-index='" + init_index + "']"), "active");

        body.className = body.className.replace(/\bviewing-page-\d.*?\b/g, '');
        _addClass(body, "viewing-page-" + next_index)
        if (history.replaceState && settings.updateURL == true) {
          var href = window.location.href.substr(0, window.location.href.indexOf('#')) + "#" + (init_index);
          history.pushState({}, document.title, href);
        }
      }
      var pos = ((init_index - 1) * 100) * -1;
      _transformPage(el, settings, pos, init_index);

    } else {
      _addClass(document.querySelector(settings.sectionContainer + "[data-index='1']"), "active");
      _addClass(body, "viewing-page-1");
      if (settings.pagination == true) _addClass(document.querySelector(".onepage-pagination li a[data-index='1']"), "active");
    }

    if (settings.pagination == true) {
      var pagination_links = document.querySelectorAll(".onepage-pagination li a");

      for (var i = 0; i < pagination_links.length; i++) {
        pagination_links[i].addEventListener('click', _paginationHandler);
      }
    }

    document.addEventListener('mousewheel', _mouseWheelHandler);
    document.addEventListener('DOMMouseScroll', _mouseWheelHandler);

    if (settings.responsiveFallback != false) {
      window.onresize = function() {
        _responsive();
      }

      _responsive();
    }

    if (settings.keyboard == true) {
      document.onkeydown = _keydownHandler;
    }
    return false;
  }

  /*-------------------------------------------------------*/
  /*  Private Functions                                    */
  /*-------------------------------------------------------*/
  /*------------------------------------------------*/
  /*  Credit: Eike Send for the awesome swipe event */
  /*------------------------------------------------*/
  var _swipeEvents = function(el) {
    var startX,
      startY;

    document.addEventListener("touchstart", touchstart);

    function touchstart(event) {
      var touches = event.touches;
      if (touches && touches.length) {
        startX = touches[0].pageX;
        startY = touches[0].pageY;
        document.addEventListener("touchmove", touchmove);
      }
    }

    function touchmove(event) {
      var touches = event.touches;
      if (touches && touches.length) {
        event.preventDefault();
        var deltaX = startX - touches[0].pageX;
        var deltaY = startY - touches[0].pageY;

        if (deltaX >= 50) {
          var event = new Event('swipeLeft');
          document.dispatchEvent(event);
        }
        if (deltaX <= -50) {
          var event = new Event('swipeRight');
          document.dispatchEvent(event);
        }
        if (deltaY >= 50) {
          var event = new Event('swipeUp');
          document.dispatchEvent(event);
        }
        if (deltaY <= -50) {
          var event = new Event('swipeDown');
          document.dispatchEvent(event);
        }

        if (Math.abs(deltaX) >= 50 || Math.abs(deltaY) >= 50) {
          document.removeEventListener('touchmove', touchmove);
        }
      }
    }

  };

  /*-----------------------------------------------------------*/
  /*  Handler Functions                                        */
  /*-----------------------------------------------------------*/
  var _keydownHandler = function(e) {
    var tag = e.target.tagName.toLowerCase();

    if (!_hasClass(body, "disabled-onepage-scroll")) {
      switch (e.which) {
        case 38:
          if (tag != 'input' && tag != 'textarea') ops.moveUp(el)
          break;
        case 40:
          if (tag != 'input' && tag != 'textarea') ops.moveDown(el)
          break;
        default:
          return;
      }
    }
    return false;
  }

  var _mouseWheelHandler = function(event) {
    event.preventDefault();
    var delta = event.wheelDelta || -event.detail;
    if (!_hasClass(body, "disabled-onepage-scroll")) {
      _init_scroll(event, delta);
    }
  }

  var _paginationHandler = function() {
    var page_index = this.dataset.index;
    ops.moveTo(el, page_index);
  }

  /*-----------------------------------------------------------*/
  /*  Utility to add/remove class easily with javascript       */
  /*-----------------------------------------------------------*/

  var _trim = function(str) {
    return str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
  }

  var _hasClass = function(ele, cls) {
    if (ele.className) {
      return ele.className.match(new RegExp('(\\s|^)' + cls + '(\\s|$)'));
    } else {
      return ele.className = cls;
    }
  }

  var _addClass = function(ele, cls) {
    if (!_hasClass(ele, cls)) ele.className += " " + cls;
    ele.className = _trim(ele.className)
  }

  var _removeClass = function(ele, cls) {
    if (_hasClass(ele, cls)) {
      var reg = new RegExp('(\\s|^)' + cls + '(\\s|$)');
      ele.className = ele.className.replace(reg, ' ');
    }
    ele.className = _trim(ele.className)
  }

  /*-----------------------------------------------------------*/
  /*  Transtionend Normalizer by Modernizr                     */
  /*-----------------------------------------------------------*/

  var _whichTransitionEvent = function() {
    var t;
    var el = document.createElement('fakeelement');
    var transitions = {
      'transition': 'transitionend',
      'OTransition': 'oTransitionEnd',
      'MozTransition': 'transitionend',
      'WebkitTransition': 'webkitTransitionEnd'
    }

    for (t in transitions) {
      if (el.style[t] !== undefined) {
        return transitions[t];
      }
    }
  }

  /*-----------------------------------------------------------*/
  /*  Function to perform scroll to top animation              */
  /*-----------------------------------------------------------*/

  var _scrollTo = function(element, to, duration) {
    if (duration < 0) return;
    var difference = to - element.scrollTop;
    var perTick = difference / duration * 10;

    setTimeout(function() {
      element.scrollTop = element.scrollTop + perTick;
      if (element.scrollTop == to) return;
      _scrollTo(element, to, duration - 10);
    }, 10);
  }



  /*---------------------------------*/
  /*  Function to transform the page */
  /*---------------------------------*/

  var _transformPage = function(el2, settings, pos, index, next_el) {

    var transformCSS = "-webkit-transform: translate3d(0, " + pos + "%, 0); -webkit-transition: -webkit-transform " + settings.animationTime + "ms " + settings.easing +
      "; -moz-transform: translate3d(0, " + pos + "%, 0); -moz-transition: -moz-transform " + settings.animationTime + "ms " + settings.easing +
      "; -ms-transform: translate3d(0, " + pos + "%, 0); -ms-transition: -ms-transform " + settings.animationTime + "ms " + settings.easing + "; transform: translate3d(0, " +
      pos + "%, 0); transition: transform " + settings.animationTime + "ms " + settings.easing + ";";

    el2.style.cssText = transformCSS;

    var transitionEnd = _whichTransitionEvent();
    el2.addEventListener(transitionEnd, endAnimation, false);

    function endAnimation() {
      if (typeof settings.afterMove == 'function') settings.afterMove(index, next_el);
      el2.removeEventListener(transitionEnd, endAnimation)
    }
  }

  /*-------------------------------------------*/
  /*  Responsive Fallback trigger              */
  /*-------------------------------------------*/

  var _responsive = function() {

      var valForTest = false;
      var typeOfRF = typeof settings.responsiveFallback

      if (typeOfRF == "number") {
        valForTest = document.body.clientWidth < settings.responsiveFallback;
      }
      if (typeOfRF == "boolean") {
        valForTest = settings.responsiveFallback;
      }

      if (valForTest) {
        _disable_scroll();
      } else {
        _enable_scroll();
      }

    }
    /*-------------------------------------------*/
    /*  re-enable onepage scroll                 */
    /*-------------------------------------------*/
  var _enable_scroll = function() {

      if (_hasClass(body, "disabled-onepage-scroll")) {
        _removeClass(body, "disabled-onepage-scroll");
        _scrollTo(document.documentElement, 0, 2000);
      }

      _swipeEvents(el);
      document.addEventListener("swipeDown", function(event) {
        if (!_hasClass(body, "disabled-onepage-scroll")) event.preventDefault();
        ops.moveUp(el);
      });
      document.addEventListener("swipeUp", function(event) {
        if (!_hasClass(body, "disabled-onepage-scroll")) event.preventDefault();
        ops.moveDown(el);
      });

      document.addEventListener('mousewheel', _mouseWheelHandler);
      document.addEventListener('DOMMouseScroll', _mouseWheelHandler);
    }
    /*-------------------------------------------*/
    /*  disable one page scroll                  */
    /*-------------------------------------------*/
  var _disable_scroll = function() {

    _addClass(body, "disabled-onepage-scroll");
    document.removeEventListener('mousewheel', _mouseWheelHandler);
    document.removeEventListener('DOMMouseScroll', _mouseWheelHandler);
    _swipeEvents(el);
    document.removeEventListener("swipeDown");
    document.removeEventListener("swipeUp");
  }


  /*-------------------------------------------*/
  /*  Initialize scroll detection              */
  /*-------------------------------------------*/

  var _init_scroll = function(event, delta) {
    var deltaOfInterest = delta,
      timeNow = new Date().getTime();

    // Cancel scroll if currently animating or within quiet period
    if (timeNow - lastAnimation < quietPeriod + settings.animationTime) {
      event.preventDefault();
      return;
    }

    if (deltaOfInterest < 0) {
      ops.moveDown(el)
    } else {
      ops.moveUp(el)
    }

    lastAnimation = timeNow;
  }

  /*-------------------------------------------------------*/
  /*  Public Functions                                     */
  /*-------------------------------------------------------*/

  /*---------------------------------*/
  /*  Function to move down section  */
  /*---------------------------------*/

  ops.moveDown = function(el3) {

    var pos;

    if (typeof el3 == "string") el3 = document.querySelector(el3);

    var index = document.querySelector(settings.sectionContainer + ".active").dataset.index,
      current = document.querySelector(settings.sectionContainer + "[data-index='" + index + "']"),
      next = document.querySelector(settings.sectionContainer + "[data-index='" + (parseInt(index) + 1) + "']");


    if (!next) {
      if (settings.loop == true) {
        pos = 0;
        next = document.querySelector(settings.sectionContainer + "[data-index='1']");
      } else {
        return
      }

    } else {
      pos = (index * 100) * -1;
    }
    var next_index = next.dataset.index;
    if (typeof settings.beforeMove == 'function') settings.beforeMove(next_index, next);
    if (blockMove == true) return;
    _removeClass(current, "active");
    _addClass(next, "active");

    if (settings.pagination == true) {
      _removeClass(document.querySelector(".onepage-pagination li a" + "[data-index='" + index + "']"), "active");
      _addClass(document.querySelector(".onepage-pagination li a" + "[data-index='" + next_index + "']"), "active");
    }

    body.className = body.className.replace(/\bviewing-page-\d.*?\b/g, '');
    _addClass(body, "viewing-page-" + next_index);

    if (history.replaceState && settings.updateURL == true) {
      var href = window.location.href.substr(0, window.location.href.indexOf('#')) + "#" + (parseInt(index) + 1);
      var stateObj = {};
      stateObj.pos = pos;
      stateObj.index = next_index;
      history.pushState(stateObj, document.title, href);
    }
    _transformPage(el3, settings, pos, next_index, next);
  }

  /*---------------------------------*/
  /*  Function to move up section    */
  /*---------------------------------*/

  ops.moveUp = function(el4) {

    var pos;

    if (typeof el4 == "string") el4 = document.querySelector(el4);

    var index = document.querySelector(settings.sectionContainer + ".active").dataset.index,
      current = document.querySelector(settings.sectionContainer + "[data-index='" + index + "']"),
      next = document.querySelector(settings.sectionContainer + "[data-index='" + (parseInt(index) - 1) + "']");

    if (!next) {
      if (settings.loop == true) {
        pos = ((total - 1) * 100) * -1;
        next = document.querySelector(settings.sectionContainer + "[data-index='" + total + "']");
      } else {
        return
      }
    } else {
      pos = ((next.dataset.index - 1) * 100) * -1;
    }
    var next_index = next.dataset.index;
    if (typeof settings.beforeMove == 'function') settings.beforeMove(next_index, next);
    if (blockMove == true) return;
    _removeClass(current, "active")
    _addClass(next, "active")

    if (settings.pagination == true) {
      _removeClass(document.querySelector(".onepage-pagination li a" + "[data-index='" + index + "']"), "active");
      _addClass(document.querySelector(".onepage-pagination li a" + "[data-index='" + next_index + "']"), "active");
    }
    body.className = body.className.replace(/\bviewing-page-\d.*?\b/g, '');
    _addClass(body, "viewing-page-" + next_index);

    if (history.replaceState && settings.updateURL == true) {
      var href = window.location.href.substr(0, window.location.href.indexOf('#')) + "#" + (parseInt(index) - 1);
      var stateObj = {};
      stateObj.pos = pos;
      stateObj.index = next_index;
      history.pushState(stateObj, document.title, href);
    }
    _transformPage(el4, settings, pos, next_index, next);
  }

  /*-------------------------------------------*/
  /*  Function to move to specified section    */
  /*-------------------------------------------*/

  ops.moveTo = function(el5, page_index) {

    var pos;

    if (typeof el5 == "string") el5 = document.querySelector(el5);

    var current = document.querySelector(settings.sectionContainer + ".active"),
      next = document.querySelector(settings.sectionContainer + "[data-index='" + (page_index) + "']");

    if (next) {
      var next_index = next.dataset.index;
      if (typeof settings.beforeMove == 'function') settings.beforeMove(next_index, next);
      if (blockMove == true) return;
      _removeClass(current, "active");
      _addClass(next, "active");

      if (settings.pagination == true) {
        _removeClass(document.querySelector(".onepage-pagination li a" + ".active"), "active");
        _addClass(document.querySelector(".onepage-pagination li a" + "[data-index='" + (page_index) + "']"), "active");
      }

      body.className = body.className.replace(/\bviewing-page-\d.*?\b/g, '');
      _addClass(body, "viewing-page-" + next_index);

      pos = ((page_index - 1) * 100) * -1;

      if (history.replaceState && settings.updateURL == true) {
        var href = window.location.href.substr(0, window.location.href.indexOf('#')) + "#" + (parseInt(page_index));
        var stateObj = {};
        stateObj.pos = pos;
        stateObj.index = page_index;
        history.pushState(stateObj, document.title, href);
      }
      _transformPage(el5, settings, pos, page_index, next);
    }
  }

  /*-------------------------------------------*/
  /*  Function blocks a move, forcing the user */
  /*  to stay on the page. Must be cleared!    */
  /*-------------------------------------------*/
  ops.moveBlock = function(isBlock) {
    blockMove = isBlock;
  }

  /*-------------------------------------------*/
  /*  moveBack shifts the page back in history */
  /*  using the state save mechanism of the    */
  /*  history API                              */
  /*                                           */
  /*-------------------------------------------*/
  ops.moveBack = function(el6, state) {
      if (history.replaceState && settings.updateURL == true) {

        if (typeof el6 == "string") el6 = document.querySelector(el6);

        var next = document.querySelector(settings.sectionContainer + "[data-index='" + (state.index) + "']");

        var next_index = next.dataset.index;
        if (typeof settings.beforeMove == 'function') settings.beforeMove(next_index, next);
        if (blockMove == true) return;
        _removeClass(el6, "active");
        _addClass(next, "active");

        if (settings.pagination == true) {
          _removeClass(document.querySelector(".onepage-pagination li a" + ".active"), "active");
          _addClass(document.querySelector(".onepage-pagination li a" + "[data-index='" + (state.index) + "']"), "active");
        }

        body.className = body.className.replace(/\bviewing-page-\d.*?\b/g, '');
        _addClass(body, "viewing-page-" + next_index);

        _transformPage(el6, settings, state.pos, state.index, next);
      }
    }
    /*-------------------------------------------*/
    /*  Disable One Page Scrolling               */
    /*-------------------------------------------*/
  ops.disable = function() {
      _disable_scroll();
    }
    /*-------------------------------------------*/
    /*  Enable One page Scrolling                */
    /*-------------------------------------------*/
  ops.enable = function() {
    _enable_scroll();
  }

  return ops;

})();

/*------------------------------------------------*/
/*  Ulitilities Method                            */
/*------------------------------------------------*/

/*-----------------------------------------------------------*/
/*  Function by John Resig to replicate extend functionality */
/*-----------------------------------------------------------*/

Object.extend = function(orig) {
  if (orig == null)
    return orig;

  for (var i = 1; i < arguments.length; i++) {
    var obj = arguments[i];
    if (obj != null) {
      for (var prop in obj) {
        var getter = obj.__lookupGetter__(prop),
          setter = obj.__lookupSetter__(prop);

        if (getter || setter) {
          if (getter)
            orig.__defineGetter__(prop, getter);
          if (setter)
            orig.__defineSetter__(prop, setter);
        } else {
          orig[prop] = obj[prop];
        }
      }
    }
  }

  return orig;
};
