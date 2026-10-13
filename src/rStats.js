/**
 * @class rStats
 * @param {rStats~Settings} [settings] Settings for the rStats instance.
 */

/**
 * @typedef {Object} rStats~Settings
 * @property {Array.<String>} [colours] An array of CSS colour values.
 * @property {Array.<String>} [css] URLs of CSS or font files to import.
 * @property {Object.<String, rStats~CounterProperties>} [values] Properties to use for each counter.
 * @property {Array.<Object>} [groups] Define groups of counters.
 * @property {Array.<Object>} [fractions] Define stacked counters.
 * @property {Array.<Object>} [plugins] Additional plugins.
 * @property {Boolean} [userTimingAPI=false] Whether the timed counters are added to the User Timing API.
 * @property {HTMLElement} [parent=document.body] Element the panel is added to.
 */

/**
 * @typedef {Object} rStats~CounterProperties
 * @property {String} [caption] Caption for this counter.
 * @property {Boolean} [average=false] Whether the values should be averaged.
 * @property {Number} [avgMs=1000] Duration for which the values should be averaged.
 * @property {Number} [below] Value below which the graph should be highlighted.
 * @property {Number} [over] Value over which the graph should be highlighted.
 * @property {Boolean} [interpolate=true] Whether framerate should be interpolated.
 * @property {String} [color] Colour of the graph.
 * @property {String} [warningColor] Colour of the graph while the value is highlighted.
 */

const css = `.rs-base{ position: absolute; z-index: 10000; padding: 10px; background-color: #222; color: #ddd;
	font-size: 10px; line-height: 1.2em; width: 350px; box-sizing: border-box;
	font-family: 'Roboto Condensed', 'Arial Narrow', tahoma, sans-serif; left: 0; top: 0; overflow: hidden; }
.rs-base.rs-hidden{ display: none; }
.rs-base .alarm{ color: #b70000; text-shadow: 0 0 0 #b70000, 0 0 1px #fff, 0 0 1px #fff, 0 0 2px #fff, 0 0 2px #fff, 0 0 3px #fff, 0 0 3px #fff, 0 0 4px #fff, 0 0 4px #fff; }
.rs-base h1{ margin: 0; padding: 0; font-size: 1.4em; font-weight: bold; color: #fff; margin-bottom: 5px; cursor: pointer; }
.rs-base div.rs-group{ margin-bottom: 10px; }
.rs-base div.rs-group.hidden{ display: none; }
.rs-base div.rs-fraction{ display: flex; align-items: flex-start; margin-bottom: 5px; }
.rs-base div.rs-legend{ flex: 1; min-width: 0; padding-right: 10px; line-height: 10px; }
.rs-base div.rs-fraction p{ text-align: right; margin: 0; padding: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.rs-base div.rs-counter-base{ display: flex; align-items: center; margin: 2px 0; height: 10px; }
.rs-base span.rs-counter-id{ flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.rs-base div.rs-counter-value{ width: 36px; padding-right: 6px; text-align: right; }
.rs-base canvas.rs-canvas{ flex: none; display: block; }`;

function addStyles() {

	if ( document.getElementById( 'rs-style' ) ) return;

	const style = document.createElement( 'style' );
	style.id = 'rs-style';
	style.textContent = css;

	// first in the head, so the page can override it
	document.head.insertBefore( style, document.head.firstChild );

}

function importCSS( url ) {

	const element = document.createElement( 'link' );
	element.href = url;
	element.rel = 'stylesheet';
	document.head.appendChild( element );

}

function rStats( settings ) {

	const _settings = Object.assign( {}, settings );
	const _colours = _settings.colours || [ '#850700', '#c74900', '#fcb300', '#284280', '#4c7c0c' ];

	_settings.values = Object.assign( {}, _settings.values );
	_settings.groups = ( _settings.groups || [] ).slice();
	_settings.fractions = ( _settings.fractions || [] ).slice();
	_settings.plugins = ( _settings.plugins || [] ).slice();

	addStyles();
	( _settings.css || [] ).forEach( importCSS );

	const _elHeight = 10, _elWidth = 200;
	const _perfCounters = {};
	let _base, _div;
	let _visible = true;

	function column( color ) {

		const canvas = document.createElement( 'canvas' );
		const ctx = canvas.getContext( '2d' );
		canvas.width = 1;
		canvas.height = 2 * _elHeight;
		ctx.fillStyle = '#444444';
		ctx.fillRect( 0, 0, 1, 2 * _elHeight );
		ctx.fillStyle = color;
		ctx.fillRect( 0, _elHeight, 1, _elHeight );
		ctx.fillStyle = '#ffffff';
		ctx.globalAlpha = 0.5;
		ctx.fillRect( 0, _elHeight, 1, 1 );
		return canvas;

	}

	function createCanvas( dom, height ) {

		const canvas = document.createElement( 'canvas' );
		canvas.width = _elWidth;
		canvas.height = height;
		canvas.style.width = canvas.width + 'px';
		canvas.style.height = canvas.height + 'px';
		canvas.className = 'rs-canvas';
		dom.appendChild( canvas );

		const ctx = canvas.getContext( '2d' );
		ctx.fillStyle = '#444444';
		ctx.fillRect( 0, 0, canvas.width, canvas.height );

		return canvas;

	}

	function Graph( _dom, _def ) {

		const _canvas = createCanvas( _dom, _elHeight );
		const _ctx = _canvas.getContext( '2d' );
		const _dotCanvas = column( _def.color || '#666666' );
		const _alarmCanvas = column( _def.warningColor || '#b70000' );
		let _max = 0, _current = 0;

		function _draw( v, alarm ) {

			if ( ! isFinite( v ) ) v = 0;

			_current += ( v - _current ) * 0.1;
			_max *= 0.99;
			if ( _current > _max ) _max = _current;

			const h = _max > 0 ? _current * _canvas.height / _max : 0;

			_ctx.drawImage( _canvas, 1, 0, _canvas.width - 1, _canvas.height, 0, 0, _canvas.width - 1, _canvas.height );
			_ctx.drawImage( alarm ? _alarmCanvas : _dotCanvas, _canvas.width - 1, _canvas.height - h - _elHeight );

		}

		return {
			draw: _draw
		};

	}

	function StackGraph( _dom, _num ) {

		const _canvas = createCanvas( _dom, _elHeight * _num );
		const _ctx = _canvas.getContext( '2d' );

		function _draw( v ) {

			_ctx.drawImage( _canvas, 1, 0, _canvas.width - 1, _canvas.height, 0, 0, _canvas.width - 1, _canvas.height );
			_ctx.fillStyle = '#444444';
			_ctx.fillRect( _canvas.width - 1, 0, 1, _canvas.height );

			let th = 0;

			for ( let j = 0; j < v.length; j ++ ) {

				// what doesn't fit in the base is left out
				const h = Math.min( Math.max( v[ j ], 0 ) * _canvas.height, _canvas.height - th );
				_ctx.fillStyle = _colours[ j % _colours.length ];
				_ctx.fillRect( _canvas.width - 1, th, 1, h );
				th += h;

			}

		}

		return {
			draw: _draw
		};

	}

	function PerfCounter( id, group ) {

		const _id = id;
		const _def = _settings.values[ _id ] || {};
		const _dom = document.createElement( 'div' );
		const _spanId = document.createElement( 'span' );
		const _spanValue = document.createElement( 'div' );
		const _spanValueText = document.createTextNode( '' );

		let _time = performance.now(),
			_value = 0,
			_total = 0,
			_averageValue = 0,
			_accumValue = 0,
			_accumStart = performance.now(),
			_accumSamples = 0,
			_started = false,
			_marks = 0,
			_markTime = null,
			_text = null,
			_alarm = null;

		_spanId.className = 'rs-counter-id';
		_spanId.textContent = _def.caption || _id;

		_spanValue.className = 'rs-counter-value';
		_spanValue.appendChild( _spanValueText );

		_dom.className = 'rs-counter-base';
		_dom.appendChild( _spanId );
		_dom.appendChild( _spanValue );
		( group ? group.div : _div ).appendChild( _dom );

		const _graph = new Graph( _dom, _def );

		function _average( v ) {

			if ( _def.average ) {

				_accumValue += v;
				_accumSamples ++;
				const t = performance.now();
				if ( t - _accumStart >= ( _def.avgMs || 1000 ) ) {

					_averageValue = _accumValue / _accumSamples;
					_accumValue = 0;
					_accumStart = t;
					_accumSamples = 0;

				}

			}

		}

		function _start() {

			_time = performance.now();
			_started = true;

		}

		function _end() {

			const t = performance.now();
			_value = t - _time;

			// a measure, without marks that pile up in the timeline of the page
			if ( _settings.userTimingAPI && _started ) {

				try {

					performance.measure( _id, { start: _time, end: t } );

				} catch ( e ) {}

			}

			_average( _value );

		}

		function _tick() {

			_end();
			_start();

		}

		function _draw() {

			const v = _def.average ? _averageValue : _value;
			const a = ( _def.below !== undefined && _value < _def.below ) || ( _def.over !== undefined && _value > _def.over );

			_graph.draw( _value, a );

			// the page is only touched when what is shown changes
			const text = String( Math.round( v * 100 ) / 100 );

			if ( text !== _text ) {

				_text = text;
				_spanValueText.nodeValue = text;

			}

			if ( a !== _alarm ) {

				_alarm = a;
				_dom.className = a ? 'rs-counter-base alarm' : 'rs-counter-base';

			}

		}

		function _frame() {

			const t = performance.now();
			const e = t - _time;
			_total ++;
			if ( e > 1000 ) {

				if ( _def.interpolate === false ) {

					_value = _total;

				} else {

					_value = _total * 1000 / e;

				}

				_total = 0;
				_time = t;
				_average( _value );

			}

		}

		function _set( v ) {

			_value = v;
			_average( _value );

		}

		function _mark( n ) {

			if ( _markTime === null ) _markTime = performance.now();
			_marks += n === undefined ? 1 : n;

		}

		// the marks of the last second become a rate, also when there were none
		function _refresh() {

			if ( _markTime === null ) return;

			const t = performance.now();
			const e = t - _markTime;

			if ( e >= 1000 ) {

				_value = _def.interpolate === false ? _marks : _marks * 1000 / e;
				_marks = 0;
				_markTime = t;
				_average( _value );

			}

		}

		return {
			set: _set,
			start: _start,
			tick: _tick,
			end: _end,
			frame: _frame,
			mark: _mark,
			refresh: _refresh,
			value: function () {

				return _value;

			},
			draw: _draw
		};

	}

	function _perf( idArg ) {

		const id = String( idArg ).toLowerCase();
		if ( _perfCounters[ id ] ) return _perfCounters[ id ];

		const group = _settings.groups.find( g => g.values.some( v => v.toLowerCase() === id ) ) || null;

		const p = new PerfCounter( id, group );
		_perfCounters[ id ] = p;
		return p;

	}

	function _init() {

		for ( const plugin of _settings.plugins ) {

			plugin.attach( _perf );
			Object.assign( _settings.values, plugin.values );
			_settings.groups = _settings.groups.concat( plugin.groups || [] );
			_settings.fractions = _settings.fractions.concat( plugin.fractions || [] );

		}

		// the ids of the counters are case-insensitive
		for ( const key of Object.keys( _settings.values ) ) {

			const value = _settings.values[ key ];
			delete _settings.values[ key ];
			_settings.values[ key.toLowerCase() ] = value;

		}

		// the settings belong to the page, what is added to them stays here
		_settings.groups = _settings.groups.map( g => Object.assign( {}, g ) );
		_settings.fractions = _settings.fractions.map( f => Object.assign( {}, f ) );

		_base = document.createElement( 'div' );
		_base.className = 'rs-base';
		_div = document.createElement( 'div' );
		_div.className = 'rs-container';
		_div.style.height = 'auto';
		_base.appendChild( _div );
		( _settings.parent || document.body ).appendChild( _base );

		for ( const g of _settings.groups ) {

			const div = document.createElement( 'div' );
			div.className = 'rs-group';
			g.div = div;
			const h1 = document.createElement( 'h1' );
			h1.textContent = g.caption;
			h1.addEventListener( 'click', function ( e ) {

				div.classList.toggle( 'hidden' );
				e.preventDefault();

			} );
			_div.appendChild( h1 );
			_div.appendChild( div );

		}

		for ( const f of _settings.fractions ) {

			const div = document.createElement( 'div' );
			div.className = 'rs-fraction';
			const legend = document.createElement( 'div' );
			legend.className = 'rs-legend';

			f.steps.forEach( function ( step, h ) {

				const def = _settings.values[ step.toLowerCase() ];
				const p = document.createElement( 'p' );
				p.textContent = ( def && def.caption ) || step;
				p.style.color = _colours[ h % _colours.length ];
				legend.appendChild( p );

			} );

			div.appendChild( legend );
			f.div = div;
			f.graph = new StackGraph( div, f.steps.length );
			_div.appendChild( div );

		}

	}

	function _update() {

		for ( const plugin of _settings.plugins ) plugin.update();

		for ( const id in _perfCounters ) _perfCounters[ id ].refresh();

		if ( ! _visible ) return;

		for ( const id in _perfCounters ) _perfCounters[ id ].draw();

		for ( const f of _settings.fractions ) {

			const v = [];
			const base = _perfCounters[ f.base.toLowerCase() ];
			const total = base ? base.value() : 0;

			if ( total > 0 ) {

				for ( const step of f.steps ) {

					const val = _perfCounters[ step.toLowerCase() ];
					v.push( val ? val.value() / total : 0 );

				}

			}

			f.graph.draw( v );

		}

	}

	function _show() {

		_visible = true;
		_base.classList.remove( 'rs-hidden' );

	}

	function _hide() {

		_visible = false;
		_base.classList.add( 'rs-hidden' );

	}

	function _destroy() {

		_visible = false;
		_base.remove();

	}

	_init();

	const _api = {
		element: _base,
		update: _update,
		show: _show,
		hide: _hide,
		destroy: _destroy
	};

	return function ( id ) {

		if ( id ) return _perf( id );
		return _api;

	};

}

export { rStats };
export default rStats;
