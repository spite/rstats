( function () {

	'use strict';

    // performance.now() polyfill from https://gist.github.com/paulirish/5438650

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

	function rGraph() {

		this.dPR = window.devicePixelRatio;

		this.canvas = document.createElement( 'canvas' );
		this.ctx = this.canvas.getContext( '2d' );
		this.max = 0;
		this.current = 0;

		this.height = 10;
		this.width = 200;

	    var c ='#666666';// _def.color ? _def.color : '#666666';

	    this.dotCanvas = document.createElement( 'canvas' );
	    this.dotCtx = this.dotCanvas.getContext( '2d' );
	    this.dotCanvas.width = 1;
	    this.dotCanvas.height = 2 * this.height * this.dPR;
	    this.dotCtx.fillStyle = '#444444';
	    this.dotCtx.fillRect( 0, 0, 1, 2 * this.height * this.dPR );
	    this.dotCtx.fillStyle = c;
	    this.dotCtx.fillRect( 0, this.height * this.dPR, 1, this.height * this.dPR );
	    this.dotCtx.fillStyle = '#ffffff';
	    this.dotCtx.globalAlpha = 0.5;
	    this.dotCtx.fillRect( 0, this.height * this.dPR, 1, 1 );
	    this.dotCtx.globalAlpha = 1;

	    this.alarmCanvas = document.createElement( 'canvas' );
	    this.alarmCtx = this.alarmCanvas.getContext( '2d' );
	    this.alarmCanvas.width = 1;
	    this.alarmCanvas.height = 2 * this.height * this.dPR;
	    this.alarmCtx.fillStyle = '#444444';
	    this.alarmCtx.fillRect( 0, 0, 1, 2 * this.height * this.dPR );
	    this.alarmCtx.fillStyle = '#b70000';
	    this.alarmCtx.fillRect( 0, this.height * this.dPR, 1, this.height * this.dPR );
	    this.alarmCtx.globalAlpha = 0.5;
	    this.alarmCtx.fillStyle = '#ffffff';
	    this.alarmCtx.fillRect( 0, this.height * this.dPR, 1, 1 );
	    this.alarmCtx.globalAlpha = 1;

	    this.init();

	}

	rGraph.prototype.init = function() {

		this.canvas.width = this.width * this.dPR;
		this.canvas.height = this.height * this.dPR;
		this.canvas.style.width = this.width + 'px';
		this.canvas.style.height = this.height + 'px';
		this.canvas.className = 'rs-canvas';

		this.ctx.fillStyle = '#444444';
		this.ctx.fillRect( 0, 0, this.canvas.width, this.canvas.height );

	}

	rGraph.prototype.draw = function( value, alarm ) {

		var v = value.get();
		this.current += ( v - this.current ) * 0.1;
		this.max *= 0.99;
		if ( this.current > this.max ) this.max = this.current;
		this.ctx.drawImage( this.canvas, 1, 0, this.canvas.width - 1, this.canvas.height, 0, 0, this.canvas.width - 1, this.canvas.height );
		if ( alarm ) {
			this.ctx.drawImage( this.alarmCanvas, this.canvas.width - 1, this.canvas.height - this.current * this.canvas.height / this.max - this.canvas.height );
		} else {
			this.ctx.drawImage( this.dotCanvas, this.canvas.width - 1, this.canvas.height - this.current * this.canvas.height / this.max - this.canvas.height );
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
		this.min = null;
		this.max = null;

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
		this.container.className = 'rs-base';
		document.body.appendChild( this.container );

	}

	rCSSView.prototype = Object.create( rView.prototype );
	rCSSView.prototype.constructor = rCSSView;

	rCSSView.prototype.importCSS = function( url ) {

		var element = document.createElement( 'link' );
		element.href = url;
		element.rel = 'stylesheet';
		element.type = 'text/css';
		document.getElementsByTagName( 'head' )[ 0 ].appendChild( element );

	}

	rCSSView.prototype.init = function( settings ) {

		this.settings = settings;

		var cssFont = 'https://fonts.googleapis.com/css?family=Roboto+Condensed:400,700,300';
		var cssRStats = ( this.settings.CSSPath ? this.settings.CSSPath : '' ) + 'rStats.css';

		var css = this.settings.css || [ cssFont, cssRStats ];
		css.forEach(function (uri) {
			this.importCSS( uri );
		}.bind( this ) );

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
		div.className = 'rs-counter-base';
		var nameSpan = document.createElement( 'span' );
		nameSpan.className = 'rs-counter-id';
		nameSpan.textContent = this.settings.values[ name ] ? ( this.settings.values[ name ].caption ? this.settings.values[ name ].caption : name ) : name;
		div.appendChild( nameSpan );
		var valueSpan = document.createElement( 'span' );
		valueSpan.className = 'rs-counter-value';
		valueSpan.textContent = '-';
		div.appendChild( valueSpan );
		var graphSpan = document.createElement( 'span' );
		graphSpan.className = 'rs-canvas'
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
			var alarm = false;
			if( this.settings.values[ key ] ) {
				if( this.settings.values[ key ].below !== undefined && v < this.settings.values[ key ].below ) alarm = true;
				if( this.settings.values[ key ].over !== undefined && v > this.settings.values[ key ].over ) alarm = true;
			}
			this.fields[ key ].graphControl.draw( values[ key ], alarm )

		}.bind( this ) );

	}

	rCSSView.prototype.resize = function() {


	}

	function rStats( settings ) {

		settings = settings || {};
		settings.values = settings.values || {};
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
	window.rCSSView = rCSSView

	if (typeof module === 'object') {
		module.exports = window.rStats;
	}

} )();
