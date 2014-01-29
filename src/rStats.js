// performance.now() polyfill from https://gist.github.com/paulirish/5438650

(function(){
 
  // prepare base perf object
  if (typeof window.performance === 'undefined') {
      window.performance = {};
  }
 
  if (!window.performance.now){
    
    var nowOffset = Date.now();
 
    if (performance.timing && performance.timing.navigationStart){
      nowOffset = performance.timing.navigationStart
    }
 
 
    window.performance.now = function now(){
      return Date.now() - nowOffset;
    }
 
  }
 
})();

function rStats( settings ) {

    'use strict';

    var element = document.createElement('link');
    element.href = 'http://fonts.googleapis.com/css?family=Roboto+Condensed:400,700,300';
    element.rel = 'stylesheet';
    element.type = 'text/css';
    document.getElementsByTagName('head')[0].appendChild(element)

    var _settings = settings || {},
        _colours = [ '#850700', '#c74900', '#fcb300', '#284280', '#4c7c0c' ];

    if( !_settings.values ) _settings.values = {};
    
    function Graph( _dom, _id ) {

        var _canvas = document.createElement( 'canvas' ),
            _ctx = _canvas.getContext( '2d' ),
            _max = 0,
            _current = 0;

        var _dotCanvas = document.createElement( 'canvas' ),
            _dotCtx = _dotCanvas.getContext( '2d' );
        _dotCanvas.width = 1;
        _dotCanvas.height = 20;
        _dotCtx.fillStyle = '#444444';
        _dotCtx.fillRect( 0, 0, 1, 20 );
        _dotCtx.fillStyle = '#666666';
        _dotCtx.fillRect( 0, 10, 1, 10 );
        _dotCtx.fillStyle = '#ffffff';
        _dotCtx.fillRect( 0, 10, 1, 1 );

        var _alarmCanvas = document.createElement( 'canvas' ),
            _alarmCtx = _alarmCanvas.getContext( '2d' );
        _alarmCanvas.width = 1;
        _alarmCanvas.height = 20;
        _alarmCtx.fillStyle = '#444444';
        _alarmCtx.fillRect( 0, 0, 1, 20 );
        _alarmCtx.fillStyle = '#b70000';
        _alarmCtx.fillRect( 0, 10, 1, 10 );
        _alarmCtx.fillStyle = '#ffffff';
        _alarmCtx.fillRect( 0, 10, 1, 1 );

        function _init() {

            _canvas.width = 200;
            _canvas.height = 10;
            _canvas.style.width = _canvas.width + 'px';
            _canvas.style.height = _canvas.height + 'px';
            _canvas.style.position = 'absolute';
            _canvas.style.right = 0;
            _dom.appendChild( _canvas );

            _ctx.fillStyle = '#444444';
            _ctx.fillRect( 0, 0, _canvas.width, _canvas.height );

        }

        function _draw( v, alarm ) {
            _current += ( v - _current ) * .1;
            _max *= .99;
            if( _current > _max ) _max = _current;
            _ctx.drawImage( _canvas, 1, 0, _canvas.width - 1, _canvas.height, 0, 0, _canvas.width - 1, _canvas.height );
            if( alarm ) {
                _ctx.drawImage( _alarmCanvas, _canvas.width - 1, _canvas.height - _current * _canvas.height / _max - 10 );
            } else {
                _ctx.drawImage( _dotCanvas, _canvas.width - 1, _canvas.height - _current * _canvas.height / _max - 10 );
            }
        }

        _init();

        return {
            draw: _draw
        }

    }

    function StackGraph( _dom, _num ) {

        var _canvas = document.createElement( 'canvas' ),
            _ctx = _canvas.getContext( '2d' ),
            _max = 0,
            _current = 0;

        function _init() {

            _canvas.width = 200;
            _canvas.height = 10 * _num;
            _canvas.style.width = _canvas.width + 'px';
            _canvas.style.height = _canvas.height + 'px';
            _canvas.style.position = 'absolute';
            _canvas.style.right = 0;
            _dom.appendChild( _canvas );

            _ctx.fillStyle = '#444444';
            _ctx.fillRect( 0, 0, _canvas.width, _canvas.height );

        }

        function _draw( v ) {
            _ctx.drawImage( _canvas, 1, 0, _canvas.width - 1, _canvas.height, 0, 0, _canvas.width - 1, _canvas.height );
            var th = 0;
            for( var j in v ) {
                var h = v[ j ] * _canvas.height;
                _ctx.fillStyle = _colours[ j ];
                _ctx.fillRect( _canvas.width - 1, th, 1, h );
                th += h;
            }
        }

        _init();

        return {
            draw: _draw
        }

    }

    function PerfCounter( id, group ) {

        var _id = id,
            _time,
            _value = 0,
            _total = 0,
            _dom = document.createElement( 'div' ),
            _spanId = document.createElement( 'span' ),
            _spanValue = document.createElement( 'div' ),
            _spanValueText = document.createTextNode( '' ),
            _graph = new Graph( _dom, _id ),
            _def = _settings?_settings.values[ _id.toLowerCase() ]:null;

        _dom.style.position = 'relative';
        _dom.style.margin = '2px 0';
        _dom.style.height = '10px';

        _spanId.style.position = 'absolute';
        _spanId.style.left = 0;
        _spanId.style.top = 0;
        _spanId.textContent = ( _def && _def.caption )?_def.caption:_id;

        _spanValue.style.position = 'absolute';
        _spanValue.style.right = '210px';
        _spanValue.style.width = '3em';
        _spanValue.style.height = '1em';
        _spanValue.style.top = 0;
        _spanValue.style.textAlign = 'right';

        _spanValue.appendChild( _spanValueText );
        
        _dom.appendChild( _spanId );
        _dom.appendChild( _spanValue );
        if( group ) group.div.appendChild( _dom );
        else _div.appendChild( _dom );

        _time = performance.now();


        function _start(){
            _time = performance.now();
        }

        function _end() {
            _value = performance.now() - _time;
        }

        function _tick() {
            _end();
            _start();
        }

        function _draw() {
            _spanValueText.nodeValue = Math.round( _value * 100 ) / 100;
            var a = ( _def && ( ( _def.below && _value < _def.below ) || ( _def.over && _value > _def.over ) ) );
            _graph.draw( _value, a );
            _dom.style.color = a?'#b70000':'#ffffff';
        }

        function _frame() {
            var t = performance.now();
            var e = t - _time;
            _total++;
            if( e > 1000 ) {
                _value = _total * 1000 / e;
                _total = 0;
                _time = t;
            }
        }

        function _set( v ) {
            _value = v;
        }

        return {
            set: _set,
            start: _start,
            tick: _tick,
            end: _end,
            frame: _frame,
            value: function(){ return _value; },
            draw: _draw
        }

    }

    function sample() {

        var _value = 0;

        function _set( v ) {
            _value = v;
        }

        return {
            set: _set,
            value: function(){ return _value; }
        }

    }

    var _div,
        _height = null;

    var _perfCounters = {},
        _samples = {};

    function _perf( id ) {

        id = id.toLowerCase();
        if( id === undefined ) id = 'default';
        if( _perfCounters[ id ] ) return _perfCounters[ id ];

        var group = null;
        if( _settings && _settings.groups ) {
            for( var j in _settings.groups ) {
                var g = _settings.groups[ parseInt( j, 10 ) ];
                if( g.values.indexOf( id.toLowerCase() ) != -1 ) {
                    group = g;
                    continue;
                }
            }
        }

        var p = new PerfCounter( id, group );
        _perfCounters[ id ] = p;
        return p;

    }

    function _init() {

        if( _settings.plugins ) {
            if( !_settings.values ) _settings.values = {};
            if( !_settings.groups ) _settings.groups = [];
            if( !_settings.fractions ) _settings.fractions = [];
            for( var j = 0; j < _settings.plugins.length; j++ ) {
                _settings.plugins[ j ].attach( _perf );
                for( var k in _settings.plugins[ j ].values ) {
                    _settings.values[ k ] = _settings.plugins[ j ].values [ k ];
                }
                _settings.groups = _settings.groups.concat( _settings.plugins[ j ].groups );
                _settings.fractions = _settings.fractions.concat( _settings.plugins[ j ].fractions );
            }
        } else {
            _settings.plugins = {};
        }

        _div = document.createElement( 'div' );
        _div.style.position = 'absolute';
        _div.style.zIndex = 10000;
        _div.style.padding = '10px';
        _div.style.backgroundColor = '#222';
        _div.style.fontSize = '10px';
        _div.style.lineHeight = '1.2em';
        _div.style.width = '350px';
        _div.style.fontFamily = 'Roboto Condensed, tahoma, sans-serif';
        _div.style.left = _div.style.top = 0;
        _div.style.overflow = 'hidden';
        document.body.appendChild( _div );

        if( !_settings ) return;

        if( _settings.groups ) {
            for( var j in _settings.groups ) {
                var g = _settings.groups[ parseInt( j, 10 ) ];
                var div = document.createElement( 'div' );
                g.div = div;
                var h1 = document.createElement( 'h1' );
                h1.textContent = g.caption;
                h1.style.margin = h1.style.padding = 0;
                h1.style.marginBottom = '5px';
                div.style.marginBottom = '10px';
                h1.style.fontSize = '14px';
                h1.style.color = '#fff'
                _div.appendChild( h1 );
                _div.appendChild( div );
            }
        }

        if( _settings.fractions ) {
            for( var j in _settings.fractions ) {
                var f = _settings.fractions[ parseInt( j, 10 ) ];
                var div = document.createElement( 'div' );
                var legend = document.createElement( 'div' );
                legend.style.position = 'absolute';
                legend.style.lineHeight = '10px';

                var h = 0;
                for( var k in _settings.fractions[ j ].steps ) {
                    var p = document.createElement( 'p' );
                    p.textContent = _settings.fractions[ j ].steps[ k ];
                    p.style.color = _colours[ h ];
                    p.style.width = '120px';
                    p.style.textAlign = 'right';
                    p.style.margin = 0;
                    p.style.padding = 0;
                    legend.appendChild( p );
                    h++;
                }
                div.appendChild( legend );
                div.style.height = h * 10 + 'px';
                div.style.position = 'relative';
                div.style.marginBottom = '5px';
                f.div = div;
                var graph = new StackGraph( div, h );
                f.graph = graph;
                _div.appendChild( div );
            }
        }

    }

    function _update() {
        
        for( var j in _settings.plugins ) {
            _settings.plugins[ j ].update();
        }

        for( var j in _perfCounters ) {
            _perfCounters[ j ].draw();
        }

        if( _settings && _settings.fractions ) {
            for( var j in _settings.fractions ) {
                var f = _settings.fractions[ parseInt( j, 10 ) ];
                var v = [];
                var base = _perfCounters[ f.base.toLowerCase() ];
                if( base ) {
                    base = base.value();
                    for( var k in _settings.fractions[ j ].steps ) {
                        var s = _settings.fractions[ j ].steps[ parseInt( k, 10 ) ].toLowerCase();
                        var val = _perfCounters[ s ];
                        if( val ) {
                            v.push( val.value() / base );
                        }
                    }
                }
                f.graph.draw( v );
            }
        }

        if( _height == null ) {
            _height = _div.clientHeight;
            _div.style.height = _height + 'px';
        }

    }

    _init();

    return function( id ) {
        if( id ) return _perf( id );
        return {
            update: _update
        }
    }

};