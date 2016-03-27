// performance.now() polyfill from https://gist.github.com/paulirish/5438650
'use strict';

( function () {

    // prepare base perf object
    if ( typeof window.performance === 'undefined' ) {
    	window.performance = {};
    }

    if ( !window.performance.now ) {

    	var nowOffset = Date.now();

    	if ( performance.timing && performance.timing.navigationStart ) {
    		nowOffset = performance.timing.navigationStart;
    	}

    	window.performance.now = function now () {
    		return Date.now() - nowOffset;
    	};

    }

    if( !window.performance.mark ) {
    	window.performance.mark = function(){}
    }

    if( !window.performance.measure ) {
    	window.performance.measure = function(){}
    }

    if( typeof window.performance.memory === 'undefined' ) {
        performance.memory = {
            jsHeapSizeLimit: 0,
            usedJSHeapSize: 0,
            totalJSHeapSize: 0
        }
    }

} )();

/*window.rStats = function rStats ( settings ) {

    function iterateKeys ( array, callback ) {
        var keys = Object.keys( array );
        for ( var j = 0, l = keys.length; j < l; j++ ) {
            callback( keys[ j ] );
        }
    }

    function importCSS ( url ) {

        var element = document.createElement( 'link' );
        element.href = url;
        element.rel = 'stylesheet';
        element.type = 'text/css';
        document.getElementsByTagName( 'head' )[ 0 ].appendChild( element );

    }

    var _settings = settings || {};
    var _colours = _settings.colours || [ '#850700', '#c74900', '#fcb300', '#284280', '#4c7c0c' ];

    var _cssFont = 'https://fonts.googleapis.com/css?family=Roboto+Condensed:400,700,300';
    var _cssRStats = ( _settings.CSSPath ? _settings.CSSPath : '' ) + 'rStats.css';

    var _css = _settings.css || [ _cssFont, _cssRStats ];
    _css.forEach(function (uri) {
        importCSS( uri );
    });

    if ( !_settings.values ) _settings.values = {};

    var _base, _div, _elHeight = 10, _elWidth = 200;
    var _perfCounters = {};


    function Graph ( _dom, _id, _defArg ) {

        var _def = _defArg || {};
        var _canvas = document.createElement( 'canvas' ),
            _ctx = _canvas.getContext( '2d' ),
            _max = 0,
            _current = 0;

        var c = _def.color ? _def.color : '#666666';

        var _dotCanvas = document.createElement( 'canvas' ),
            _dotCtx = _dotCanvas.getContext( '2d' );
        _dotCanvas.width = 1;
        _dotCanvas.height = 2 * _elHeight;
        _dotCtx.fillStyle = '#444444';
        _dotCtx.fillRect( 0, 0, 1, 2 * _elHeight );
        _dotCtx.fillStyle = c;
        _dotCtx.fillRect( 0, _elHeight, 1, _elHeight );
        _dotCtx.fillStyle = '#ffffff';
        _dotCtx.globalAlpha = 0.5;
        _dotCtx.fillRect( 0, _elHeight, 1, 1 );
        _dotCtx.globalAlpha = 1;

        var _alarmCanvas = document.createElement( 'canvas' ),
            _alarmCtx = _alarmCanvas.getContext( '2d' );
        _alarmCanvas.width = 1;
        _alarmCanvas.height = 2 * _elHeight;
        _alarmCtx.fillStyle = '#444444';
        _alarmCtx.fillRect( 0, 0, 1, 2 * _elHeight );
        _alarmCtx.fillStyle = '#b70000';
        _alarmCtx.fillRect( 0, _elHeight, 1, _elHeight );
        _alarmCtx.globalAlpha = 0.5;
        _alarmCtx.fillStyle = '#ffffff';
        _alarmCtx.fillRect( 0, _elHeight, 1, 1 );
        _alarmCtx.globalAlpha = 1;

        function _init () {

            _canvas.width = _elWidth;
            _canvas.height = _elHeight;
            _canvas.style.width = _canvas.width + 'px';
            _canvas.style.height = _canvas.height + 'px';
            _canvas.className = 'rs-canvas';
            _dom.appendChild( _canvas );

            _ctx.fillStyle = '#444444';
            _ctx.fillRect( 0, 0, _canvas.width, _canvas.height );

        }

        function _draw ( v, alarm ) {
            _current += ( v - _current ) * 0.1;
            _max *= 0.99;
            if ( _current > _max ) _max = _current;
            _ctx.drawImage( _canvas, 1, 0, _canvas.width - 1, _canvas.height, 0, 0, _canvas.width - 1, _canvas.height );
            if ( alarm ) {
                _ctx.drawImage( _alarmCanvas, _canvas.width - 1, _canvas.height - _current * _canvas.height / _max - _elHeight );
            } else {
                _ctx.drawImage( _dotCanvas, _canvas.width - 1, _canvas.height - _current * _canvas.height / _max - _elHeight );
            }
        }

        _init();

        return {
            draw: _draw
        };

    }

    function StackGraph ( _dom, _num ) {

        var _canvas = document.createElement( 'canvas' ),
            _ctx = _canvas.getContext( '2d' );

        function _init () {

            _canvas.width = _elWidth;
            _canvas.height = _elHeight * _num;
            _canvas.style.width = _canvas.width + 'px';
            _canvas.style.height = _canvas.height + 'px';
            _canvas.className = 'rs-canvas';
            _dom.appendChild( _canvas );

            _ctx.fillStyle = '#444444';
            _ctx.fillRect( 0, 0, _canvas.width, _canvas.height );

        }

        function _draw ( v ) {
            _ctx.drawImage( _canvas, 1, 0, _canvas.width - 1, _canvas.height, 0, 0, _canvas.width - 1, _canvas.height );
            var th = 0;
            iterateKeys( v, function ( j ) {
                var h = v[ j ] * _canvas.height;
                _ctx.fillStyle = _colours[ j ];
                _ctx.fillRect( _canvas.width - 1, th, 1, h );
                th += h;
            } );
        }

        _init();

        return {
            draw: _draw
        };

    }

    function PerfCounter ( id, group ) {

        var _id = id,
            _time,
            _value = 0,
            _total = 0,
            _averageValue = 0,
            _accumValue = 0,
            _accumStart = performance.now(),
            _accumSamples = 0,
            _dom = document.createElement( 'div' ),
            _spanId = document.createElement( 'span' ),
            _spanValue = document.createElement( 'div' ),
            _spanValueText = document.createTextNode( '' ),
            _def = _settings ? _settings.values[ _id.toLowerCase() ] : null,
            _graph = new Graph( _dom, _id, _def ),
            _started = false;

        _dom.className = 'rs-counter-base';

        _spanId.className = 'rs-counter-id';
        _spanId.textContent = ( _def && _def.caption ) ? _def.caption : _id;

        _spanValue.className = 'rs-counter-value';
        _spanValue.appendChild( _spanValueText );

        _dom.appendChild( _spanId );
        _dom.appendChild( _spanValue );
        if ( group ) group.div.appendChild( _dom );
        else _div.appendChild( _dom );

        _time = performance.now();

        function _average ( v ) {
            if ( _def && _def.average ) {
                _accumValue += v;
                _accumSamples++;
                var t = performance.now();
                if ( t - _accumStart >= ( _def.avgMs || 1000 ) ) {
                    _averageValue = _accumValue / _accumSamples;
                    _accumValue = 0;
                    _accumStart = t;
                    _accumSamples = 0;
                }
            }
        }

        function _start () {
            _time = performance.now();
            if( _settings.userTimingAPI ) performance.mark( _id + '-start' );
            _started = true;
        }

        function _end () {
            _value = performance.now() - _time;
            if( _settings.userTimingAPI ) {
                performance.mark( _id + '-end' );
                if( _started ) {
                    performance.measure( _id, _id + '-start', _id + '-end' );
                }
            }
            _average( _value );
        }

        function _tick () {
            _end();
            _start();
        }

        function _draw () {
            var v = ( _def && _def.average ) ? _averageValue : _value;
            _spanValueText.nodeValue = Math.round( v * 100 ) / 100;
            var a = ( _def && ( ( _def.below && _value < _def.below ) || ( _def.over && _value > _def.over ) ) );
            _graph.draw( _value, a );
            _dom.style.color = a ? '#b70000' : '#ffffff';
        }

        function _frame () {
            var t = performance.now();
            var e = t - _time;
            _total++;
            if ( e > 1000 ) {
                if ( _def && _def.interpolate === false ) {
                    _value = _total;
                } else {
                    _value = _total * 1000 / e;
                }
                _total = 0;
                _time = t;
                _average( _value );
            }
        }

        function _set ( v ) {
            _value = v;
            _average( _value );
        }

        return {
            set: _set,
            start: _start,
            tick: _tick,
            end: _end,
            frame: _frame,
            value: function () {
                return _value;
            },
            draw: _draw
        };

    }

    function sample () {

        var _value = 0;

        function _set ( v ) {
            _value = v;
        }

        return {
            set: _set,
            value: function () {
                return _value;
            }
        };

    }

    function _perf ( idArg ) {

        var id = idArg.toLowerCase();
        if ( id === undefined ) id = 'default';
        if ( _perfCounters[ id ] ) return _perfCounters[ id ];

        var group = null;
        if ( _settings && _settings.groups ) {
            iterateKeys( _settings.groups, function ( j ) {
                var g = _settings.groups[ parseInt( j, 10 ) ];
                if ( !group && g.values.indexOf( id.toLowerCase() ) !== -1 ) {
                    group = g;
                }
            } );
        }

        var p = new PerfCounter( id, group );
        _perfCounters[ id ] = p;
        return p;

    }

    function _init () {

        if ( _settings.plugins ) {
            if ( !_settings.values ) _settings.values = {};
            if ( !_settings.groups ) _settings.groups = [];
            if ( !_settings.fractions ) _settings.fractions = [];
            for ( var j = 0; j < _settings.plugins.length; j++ ) {
                _settings.plugins[ j ].attach( _perf );
                iterateKeys( _settings.plugins[ j ].values, function ( k ) {
                    _settings.values[ k ] = _settings.plugins[ j ].values[ k ];
                } );
                _settings.groups = _settings.groups.concat( _settings.plugins[ j ].groups );
                _settings.fractions = _settings.fractions.concat( _settings.plugins[ j ].fractions );
            }
        } else {
            _settings.plugins = {};
        }

        _base = document.createElement( 'div' );
        _base.className = 'rs-base';
        _div = document.createElement( 'div' );
        _div.className = 'rs-container';
        _div.style.height = 'auto';
        _base.appendChild( _div );
        document.body.appendChild( _base );

        if ( !_settings ) return;

        if ( _settings.groups ) {
            iterateKeys( _settings.groups, function ( j ) {
                var g = _settings.groups[ parseInt( j, 10 ) ];
                var div = document.createElement( 'div' );
                div.className = 'rs-group';
                g.div = div;
                var h1 = document.createElement( 'h1' );
                h1.textContent = g.caption;
                h1.addEventListener( 'click', function ( e ) {
                    this.classList.toggle( 'hidden' );
                    e.preventDefault();
                }.bind( div ) );
                _div.appendChild( h1 );
                _div.appendChild( div );
            } );
        }

        if ( _settings.fractions ) {
            iterateKeys( _settings.fractions, function ( j ) {
                var f = _settings.fractions[ parseInt( j, 10 ) ];
                var div = document.createElement( 'div' );
                div.className = 'rs-fraction';
                var legend = document.createElement( 'div' );
                legend.className = 'rs-legend';

                var h = 0;
                iterateKeys( _settings.fractions[ j ].steps, function ( k ) {
                    var p = document.createElement( 'p' );
                    p.textContent = _settings.fractions[ j ].steps[ k ];
                    p.style.color = _colours[ h ];
                    legend.appendChild( p );
                    h++;
                } );
                div.appendChild( legend );
                div.style.height = h * _elHeight + 'px';
                f.div = div;
                var graph = new StackGraph( div, h );
                f.graph = graph;
                _div.appendChild( div );
            } );
        }

    }

    function _update () {

        iterateKeys( _settings.plugins, function ( j ) {
            _settings.plugins[ j ].update();
        } );

        iterateKeys( _perfCounters, function ( j ) {
            _perfCounters[ j ].draw();
        } );

        if ( _settings && _settings.fractions ) {
            iterateKeys( _settings.fractions, function ( j ) {
                var f = _settings.fractions[ parseInt( j, 10 ) ];
                var v = [];
                var base = _perfCounters[ f.base.toLowerCase() ];
                if ( base ) {
                    base = base.value();
                    iterateKeys( _settings.fractions[ j ].steps, function ( k ) {
                        var s = _settings.fractions[ j ].steps[ parseInt( k, 10 ) ].toLowerCase();
                        var val = _perfCounters[ s ];
                        if ( val ) {
                            v.push( val.value() / base );
                        }
                    } );
                }
                f.graph.draw( v );
            } );
        }
    }

    _init();

    return function ( id ) {
        if ( id ) return _perf( id );
        return {
            element: _base,
            update: _update
        };
    };

}*/

function rGraph() {

    this.canvas = document.createElement( 'canvas' );
    this.ctx = this.canvas.getContext( '2d' );
    this.max = 0;
    this.current = 0;

    this.height = 13;
    this.width = 200;

    var c ='#666666';// _def.color ? _def.color : '#666666';

    this.dotCanvas = document.createElement( 'canvas' );
    this.dotCtx = this.dotCanvas.getContext( '2d' );
    this.dotCanvas.width = 1;
    this.dotCanvas.height = 2 * this.height;
    this.dotCtx.fillStyle = '#444444';
    this.dotCtx.fillRect( 0, 0, 1, 2 * this.height );
    this.dotCtx.fillStyle = c;
    this.dotCtx.fillRect( 0, this.height, 1, this.height );
    this.dotCtx.fillStyle = '#ffffff';
    this.dotCtx.globalAlpha = 0.5;
    this.dotCtx.fillRect( 0, this.height, 1, 1 );
    this.dotCtx.globalAlpha = 1;

    this.alarmCanvas = document.createElement( 'canvas' );
    this.alarmCtx = this.alarmCanvas.getContext( '2d' );
    this.alarmCanvas.width = 1;
    this.alarmCanvas.height = 2 * this.height;
    this.alarmCtx.fillStyle = '#444444';
    this.alarmCtx.fillRect( 0, 0, 1, 2 * this.height );
    this.alarmCtx.fillStyle = '#b70000';
    this.alarmCtx.fillRect( 0, this.height, 1, this.height );
    this.alarmCtx.globalAlpha = 0.5;
    this.alarmCtx.fillStyle = '#ffffff';
    this.alarmCtx.fillRect( 0, this.height, 1, 1 );
    this.alarmCtx.globalAlpha = 1;

    this.init();

}

rGraph.prototype.init = function() {

    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.canvas.style.width = this.canvas.width + 'px';
    this.canvas.style.height = this.canvas.height + 'px';
    this.canvas.className = 'rs-canvas';

    this.ctx.fillStyle = '#444444';
    this.ctx.fillRect( 0, 0, this.canvas.width, this.canvas.height );

}

rGraph.prototype.draw = function( v, alarm ) {

    this.current += ( v - this.current ) * 0.1;
    this.max *= 0.99;
    if ( this.current > this.max ) this.max = this.current;
    this.ctx.drawImage( this.canvas, 1, 0, this.canvas.width - 1, this.canvas.height, 0, 0, this.canvas.width - 1, this.canvas.height );
    if ( alarm ) {
        this.ctx.drawImage( this.alarmCanvas, this.canvas.width - 1, this.canvas.height - this.current * this.canvas.height / this.max - this.height );
    } else {
        this.ctx.drawImage( this.dotCanvas, this.canvas.width - 1, this.canvas.height - this.current * this.canvas.height / this.max - this.height );
    }
}

function rValue( id, settings ) {

    this.settings = settings;
    this.definition = settings.values[ id ] || {}; 
	this.id = id;
	this.started = false;
	this.time = null;
	this.value = 0;
	this.total = 0;
    this.averageValue = 0;
    this.accumValue = 0;
    this.accumStart = performance.now();
    this.accumSamples = 0;

}

rValue.prototype.start = function() {
	this.started = true;
	if( this.settings.userTimingAPI ) {
    	performance.mark( this.id + '-start' );
    }
	this.time = performance.now();
}

rValue.prototype.end = function() {

	this.value = performance.now() - this.time;
	if( this.settings.userTimingAPI ) {
		performance.mark( this.id + '-end' );
		if( this.started ) {
			performance.measure( this.id, this.id + '-start', this.id + '-end' );
		}
	}
	this.average( this.value );

}

rValue.prototype.tick = function() {
	this.end();
	this.start();
}

rValue.prototype.frame = function() {

	var t = performance.now();
	var e = t - this.time;
	this.total++;
	if ( e > 1000 ) {
		if ( this.definition.interpolate === false ) {
			this.value = this.total;
		} else {
            this.value = this.total * 1000 / e;
		}
		this.total = 0;
		this.time = t;
        this.average( this.value );
	}

}

rValue.prototype.average = function( v ) {

    if ( this.definition.average ) {
        this.accumValue += v;
        this.accumSamples++;
        var t = performance.now();
        if ( t - this.accumStart >= ( this.definition.avgMs || 1000 ) ) {
            this.averageValue = this.accumValue / this.accumSamples;
            this.accumValue = 0;
            this.accumStart = t;
            this.accumSamples = 0;
        }
    }

}


rValue.prototype.set = function( value ) {
	
	this.value = value;

}

rValue.prototype.get = function() {

    return this.definition.average ? this.averageValue : this.value
}

function rView() {

}

rView.prototype.update = function( keys, values ) {

	keys.forEach( function( key ) {

		//console.log( key, values[ key ].value );

	} );

    //console.log( 'frame', values[ 'frame' ].value, 1000 / values[ 'frame' ].value );

}

function rCSSView() {

    this.fields = {};
    this.groups = {};
    this.fieldToGroup = {}

    this.container = document.createElement( 'div' );
    this.container.className = 'rstats-container';
    this.container.style.position = 'absolute';
    this.container.style.backgroundColor = 'black';
    document.body.appendChild( this.container );

}

rCSSView.prototype = Object.create( rView.prototype );
rCSSView.prototype.constructor = rCSSView;

rCSSView.prototype.init = function( settings ) {

    this.settings = settings;

    for( var j in this.settings.groups ) {
        var g = document.createElement( 'div' );
        var h = document.createElement( 'h1' );
        h.textContent = this.settings.groups[ j ].caption
        g.appendChild( h )
        this.container.appendChild( g );
        this.settings.groups[ j ].values.forEach( function( f ) {
            this.fieldToGroup[ f ] = g;
        }.bind( this ) )
    }

}

rCSSView.prototype.addField = function( name ) {

    var div = document.createElement( 'div' );
    var nameSpan = document.createElement( 'span' );
    nameSpan.textContent = this.settings.values[ name ] ? ( this.settings.values[ name ].caption ? this.settings.values[ name ].caption : name ) : name;
    div.appendChild( nameSpan );
    var valueSpan = document.createElement( 'span' );
    valueSpan.textContent = '-';
    div.appendChild( valueSpan );
    var graphSpan = document.createElement( 'span' );
    var graphControl = new rGraph();
    graphSpan.appendChild( graphControl.canvas )
    div.appendChild( graphSpan );
    
    if( this.fieldToGroup[ name ] ) {
        this.fieldToGroup[ name ].appendChild( div );
    } else {
        this.container.appendChild( div );
    }

    this.fields[ name ] = {
        nameSpan: nameSpan,
        valueSpan: valueSpan,
        graphSpan: graphSpan,
        graphControl: graphControl,
        units: this.settings.values[ name ] ? ( this.settings.values[ name ].units ? ' ' + this.settings.values[ name ].units : '' ) : ''
    }

}

rCSSView.prototype.update = function( keys, values ) {

    keys.forEach( function( key ) {

        if( !this.fields[ key ] ) {
            this.addField( key )
        }
        var v = values[ key ].get();
        this.fields[ key ].valueSpan.textContent = v.toFixed( 2 ) + this.fields[ key ].units;
        this.fields[ key ].graphControl.draw( v )

    }.bind( this ) );

}

function rStats( settings ) {

	var id = settings.id || 'rStats';

	var values = {};
	var keys = [];
	var views = [];

	function body( id ) {

		id = ( id || 'default' ).toLowerCase();
		if( values[ id ] ) return values[ id ];

		var v = new rValue( id, settings );
		values[ id ] = v
		keys.push( id );
		return v;

	}

	body.update = function() {

		views.forEach( function( v ) { v.update( keys, values ) } );

	}

	body.attachView = function( view ) {

        view.init( settings );
		views.push( view );

	}

	return body;

}

window.rStats = rStats
window.rView = rView

if (typeof module === 'object') {
	module.exports = window.rStats;
}
