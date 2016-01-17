//window.callPhantom({sendEvent: ['keydown', 16777235]});

describe('Barba.js available', function() {
  it('Barba exposed', function() {
    expect(Barba).to.be.an('object');
    expect(Barba.version).to.be.a('string');
  });

  it('Promise enabled', function() {
    expect(Promise).to.be.a('function');
  });
});

describe('Barba.js Dispatcher', function() {
  it('Dispatcher is declared', function() {
    expect(Barba.Dispatcher).to.be.an('object');
  });

  var fired = false;
  var invertFired = function() {
    fired = !fired;
  };

  it('Register an event', function() {
    Barba.Dispatcher.on('test', invertFired);

    expect(Barba.Dispatcher.events)
      .to.be.an('object')
      .to.include.keys('test');
  });

  it('Trigger an event', function() {
    Barba.Dispatcher.trigger('test');
    expect(fired).to.equal(true);
  });

  it('Remove an event', function() {
    Barba.Dispatcher.off('test', invertFired);
    Barba.Dispatcher.trigger('test');

    expect(fired).to.equal(true);
  });
})

describe('Barba.js HistoryManager', function() {
  it('HistoryManager is declared', function() {
    expect(Barba.HistoryManager).to.be.an('object');
  });

  it('Add a status', function() {
    Barba.HistoryManager.add('/fakeurl.html', 'fakenamespace');
    Barba.HistoryManager.add('/fakeurl2.html');

    expect(Barba.HistoryManager.states.length).to.equal(2);
  });

  it('Current status', function() {
    var currentStatus = Barba.HistoryManager.currentStatus();

    expect(currentStatus.url).to.equal('/fakeurl2.html');
    expect(currentStatus.namespace).to.equal(undefined);
  });

  it('Prev status', function() {
    var prevStatus = Barba.HistoryManager.prevStatus();

    expect(prevStatus.url).to.equal('/fakeurl.html');
    expect(prevStatus.namespace).to.equal('fakenamespace');
  });
});

describe('Barba.js Cache', function() {
  it('Is declared', function() {
    expect(Barba.Pjax.Cache).to.be.an('object');
  });

  it('Save data', function() {
    Barba.Pjax.Cache.set('foo', 'bar');
  });

  it('Get data', function() {
    expect(Barba.Pjax.Cache.get('foo')).to.equal('bar');
  });

  it('Reset data', function() {
    Barba.Pjax.Cache.reset();

    expect(Barba.Pjax.Cache.data.length).to.equal(0);
    expect(Barba.Pjax.Cache.get('foo')).to.equal(undefined);
  });
});

var matchStatus = function(status) {
  var url = status.url.split('/').pop();

  expect(url).to.equal('runner.html');
  expect(status.namespace).to.equal('page1');
};

describe('Barba.js init current status event', function() {
  it('initStateChange', function(done) {
    Barba.Dispatcher.on('initStateChange', function(status) {
      matchStatus(status);
      done();
    });

    Barba.Pjax.init();
  });
});

describe('Barba.js init current status event', function() {
  it('newPageReady', function(done) {
    Barba.Dispatcher.on('newPageReady', function(status) {
      matchStatus(status);
      done();
    });

    Barba.Pjax.init();
  });
});

describe('Barba.js init current status event', function() {
  it('transitionCompleted', function(done) {
    Barba.Dispatcher.on('transitionCompleted', function(status) {
      matchStatus(status);
      done();
    });

    Barba.Pjax.init();
  });
});

describe('Barba.js page changing', function() {
  before(function() {

    //Barba.Pjax.cacheEnabled = true;
  });



  it('First page events/history', function(done) {
    //var currentStatus = Barba.Pjax.History.currentStatus();
    //matchStatus(currentStatus);

    //Barba.Pjax.init();
  });

  var testLink = document.getElementById('testlink');

  it('Click on link', function() {
    //testLink.click();
  });
});

/*
 - Prefetch
 - Title page changing
 - Cache false
 - Next/Prev button in browser
 - CTRL + click
 */
