var Utils = require('../Utils/Utils');
var Dispatcher = require('../Dispatcher/Dispatcher');
var HideShowTransition = require('../Transition/HideShowTransition');
var BaseCache = require('../Cache/BaseCache');

var HistoryManager = require('./HistoryManager');
var Dom = require('./Dom');

/**
 * Pjax is a static object with main function
 *
 * @namespace Barba.Pjax
 * @borrows Dom as Dom
 * @type {Object}
 */
var Pjax = {
  Dom: Dom,
  History: HistoryManager,
  Cache: BaseCache,

  /**
   * Indicate wether or not use the cache
   * @memberOf Barba.Pjax
   * @type {Boolean}
   */
  cacheEnabled: true,

  /**
   * Indicate if there is an animation in progress
   * @memberOf Barba.Pjax
   * @readOnly
   * @type {Boolean}
   */
  transitionProgress: false,

  /**
   * Function to be called to start Pjax
   * @memberOf Barba.Pjax
   */
  start: function() {
    this.init();
  },

  /**
   * [init description]
   * @private
   */
  init: function() {
    this.History.add(
      this.getCurrentUrl(),
      this.Dom.getNamespace(this.Dom.getContainer())
    );

    //Fire for the current view.
    Dispatcher.trigger('initStateChange', this.History.currentStatus());
    Dispatcher.trigger('newPageReady', this.History.currentStatus());
    Dispatcher.trigger('transitionCompleted', this.History.currentStatus());

    this.bindEvents();
  },

  /**
   * Attach the eventlisteners
   * @memberOf Barba.Pjax
   * @private
   */
  bindEvents: function() {
    document.addEventListener('click',
      this.onLinkClick.bind(this)
    );

    window.addEventListener('popstate',
      this.onStateChange.bind(this)
    );
  },

  /**
   * Return the currentURL
   * @memberOf Barba.Pjax
   * @return {String} currentUrl
   */
  getCurrentUrl: function() {
    return Utils.cleanLink(
      Utils.getCurrentUrl()
    );
  },

  /**
   * Change the URL with pushstate and trigger the state change
   * @memberOf Barba.Pjax
   * @param  {String} newUrl
   */
  goTo: function(url) {
    window.history.pushState(null, null, url);
    this.onStateChange();
  },

  /**
   * Force the browser to go to a certain url
   * @memberOf Barba.Pjax
   * @param  {String} url
   * @private
   */
  forceGoTo: function(url) {
    window.location = url;
  },

  /**
   * Load an url, will start an xhr request or load from the cache
   *
   * @memberOf Barba.Pjax
   * @private
   * @param  {String} url
   * @return {Promise}
   */
  load: function(url) {
    var deferred = Utils.deferred();
    var _this = this;
    var xhr;

    xhr = this.Cache.get(url);

    if (!xhr) {
      xhr = Utils.xhr(url);
      this.Cache.set(url, xhr);
    }

    xhr.then(
      function(data) {
        var container = _this.Dom.parseResponse(data);
        var namespace = _this.Dom.getNamespace(container);

        _this.Dom.putContainer(container);

        if (!_this.cacheEnabled)
          _this.Cache.reset();

        deferred.resolve(container);
      },
      function() {
        //Something went wrong (timeout, 404, 505...)
        _this.forceGoTo(url);

        deferred.reject();
      }
    );

    return deferred.promise;
  },

  /**
   * Callback called from click event
   * @private
   * @param  {MouseEvent} evt
   */
  onLinkClick: function(evt) {
    var el = evt.target;

    //Go up in the nodelist until we
    //find something with .href
    while (el && !el.href) {
      el = el.parentNode;
    }

    if (this.preventCheck(evt, el)) {
      evt.stopPropagation();
      evt.preventDefault();

      Dispatcher.trigger('linkClicked', el);
      this.goTo(el.href);
    }
  },

  /**
   * Determine if the link should be followed
   * @memberOf Barba.Pjax
   * @param  {MouseEvent} evt [description]
   * @param {HTMLElement} element
   * @return {Boolean}     [description]
   */
  preventCheck: function(evt, element) {
    //User
    if (!element || !element.href)
      return false;

    //Middle click, cmd click, and ctrl click
    if (evt.which > 1 || evt.metaKey || evt.ctrlKey || evt.shiftKey || evt.altKey)
      return false;

    //Ignore target with _blank target
    if (element.target && element.target === '_blank')
      return false;

    //Check if it's the same domain
    if (window.location.protocol !== element.protocol || window.location.hostname !== element.hostname)
      return false;

    //Ignore case when a hash is being tacked on the current URL
    if (element.href.indexOf('#') > -1)
      return false;

    //In case you're trying to load the same page
    if (Utils.cleanLink(element.href) == Utils.cleanLink(location.href))
      return false;

    if (element.classList.contains('no-barba'))
      return false;

    return true;
  },

  /**
   * Return a transition object
   * @memberOf Barba.Pjax
   * @return {Barba.Transition} Transition object
   */
  getTransition: function() {
    //User customizable
    return HideShowTransition;
  },

  /**
   * Method called after a 'popstate' or from .goTo()
   * @memberOf Barba.Pjax
   * @private
   */
  onStateChange: function() {
    var _this = this;
    var newUrl = this.getCurrentUrl();

    if (this.transitionProgress)
      this.forceGoTo(newUrl);

    if (this.History.currentStatus().url === newUrl)
      return false;

    var newContainer = this.load(newUrl);
    this.History.add(newUrl);

    var transition = Object.create(this.getTransition());
    this.transitionProgress = true;

    Dispatcher.trigger('initStateChange',
      this.History.currentStatus(),
      this.History.prevStatus()
    );

    var transitionInstance = transition.init(
      this.Dom.getContainer(),
      newContainer
    );

    newContainer.then(
      this.onNewContainerLoaded.bind(this)
    );

    transitionInstance.then(
      this.onTransitionEnd.bind(this)
    );
  },

  /**
   * Function called as soon the new container is ready
   * @memberOf Barba.Pjax
   * @private
   * @param  {HTMLElement} container
   */
  onNewContainerLoaded: function(container) {
    var currentStatus = this.History.currentStatus();
    currentStatus.namespace = this.Dom.getNamespace(container);

    Dispatcher.trigger('newPageReady',
      this.History.currentStatus(),
      this.History.prevStatus()
    );
  },

  /**
   * Function called as soon the transition is finished
   * @memberOf Barba.Pjax
   * @private
   */
  onTransitionEnd: function() {
    this.transitionProgress = false;

    Dispatcher.trigger('transitionCompleted',
      this.History.currentStatus(),
      this.History.prevStatus()
    );
  }
};

module.exports = Pjax;
