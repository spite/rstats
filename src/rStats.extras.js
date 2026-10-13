const _gl = {
	drawArraysCalls: 0,
	drawElementsCalls: 0,
	useProgramCalls: 0,
	bindTextures: 0,
	faces: 0,
	vertices: 0,
	points: 0
};

let _hooked = false;

function _h( f, c ) {

	return function () {

		c.apply( this, arguments );
		return f.apply( this, arguments );

	};

}

function _count( gl, mode, count, instances ) {

	if ( mode === gl.POINTS ) _gl.points += count * instances;
	else _gl.vertices += count * instances;

	if ( mode === gl.TRIANGLES ) _gl.faces += Math.floor( count / 3 ) * instances;
	else if ( mode === gl.TRIANGLE_STRIP || mode === gl.TRIANGLE_FAN ) _gl.faces += Math.max( 0, count - 2 ) * instances;

}

// the hooks are added once, to the contexts of WebGL 1 and WebGL 2
function _hook() {

	if ( _hooked ) return;
	_hooked = true;

	const arrays = {
		drawArrays: a => [ a[ 0 ], a[ 2 ], 1 ],
		drawArraysInstanced: a => [ a[ 0 ], a[ 2 ], a[ 3 ] ]
	};

	const elements = {
		drawElements: a => [ a[ 0 ], a[ 1 ], 1 ],
		drawElementsInstanced: a => [ a[ 0 ], a[ 1 ], a[ 4 ] ],
		drawRangeElements: a => [ a[ 0 ], a[ 3 ], 1 ]
	};

	for ( const name of [ 'WebGLRenderingContext', 'WebGL2RenderingContext' ] ) {

		if ( globalThis[ name ] === undefined ) continue;

		const proto = globalThis[ name ].prototype;

		for ( const method in arrays ) {

			if ( proto[ method ] === undefined ) continue;

			proto[ method ] = _h( proto[ method ], function () {

				_gl.drawArraysCalls ++;
				_count( this, ...arrays[ method ]( arguments ) );

			} );

		}

		for ( const method in elements ) {

			if ( proto[ method ] === undefined ) continue;

			proto[ method ] = _h( proto[ method ], function () {

				_gl.drawElementsCalls ++;
				_count( this, ...elements[ method ]( arguments ) );

			} );

		}

		proto.useProgram = _h( proto.useProgram, function () {

			_gl.useProgramCalls ++;

		} );

		proto.bindTexture = _h( proto.bindTexture, function () {

			_gl.bindTextures ++;

		} );

	}

}

function glStats() {

	let _rS = null;

	_hook();

	const _values = {
		allcalls: {
			over: 3000,
			caption: 'Calls (hook)'
		},
		drawelements: {
			caption: 'drawElements (hook)'
		},
		drawarrays: {
			caption: 'drawArrays (hook)'
		}
	};

	const _groups = [ {
		caption: 'WebGL',
		values: [ 'allcalls', 'drawelements', 'drawarrays', 'useprogram', 'bindtexture', 'glfaces', 'glvertices', 'glpoints' ]
	} ];

	const _fractions = [ {
		base: 'allcalls',
		steps: [ 'drawelements', 'drawarrays' ]
	} ];

	function _update() {

		_rS( 'allcalls' ).set( _gl.drawArraysCalls + _gl.drawElementsCalls );
		_rS( 'drawElements' ).set( _gl.drawElementsCalls );
		_rS( 'drawArrays' ).set( _gl.drawArraysCalls );
		_rS( 'bindTexture' ).set( _gl.bindTextures );
		_rS( 'useProgram' ).set( _gl.useProgramCalls );
		_rS( 'glfaces' ).set( _gl.faces );
		_rS( 'glvertices' ).set( _gl.vertices );
		_rS( 'glpoints' ).set( _gl.points );

	}

	function _start() {

		for ( const key in _gl ) _gl[ key ] = 0;

	}

	function _end() {}

	function _attach( r ) {

		_rS = r;

	}

	return {
		update: _update,
		start: _start,
		end: _end,
		attach: _attach,
		values: _values,
		groups: _groups,
		fractions: _fractions
	};

}

function threeStats( renderer ) {

	let _rS = null;

	const _values = {
		'renderer.info.memory.geometries': {
			caption: 'Geometries'
		},
		'renderer.info.memory.textures': {
			caption: 'Textures'
		},
		'renderer.info.programs': {
			caption: 'Programs'
		},
		'renderer.info.render.calls': {
			caption: 'Calls'
		},
		'renderer.info.render.triangles': {
			caption: 'Triangles'
		},
		'renderer.info.render.points': {
			caption: 'Points'
		},
		'renderer.info.render.lines': {
			caption: 'Lines'
		}
	};

	const _groups = [ {
		caption: 'Three.js - Memory',
		values: [ 'renderer.info.memory.geometries', 'renderer.info.programs', 'renderer.info.memory.textures' ]
	}, {
		caption: 'Three.js - Render',
		values: [ 'renderer.info.render.calls', 'renderer.info.render.triangles', 'renderer.info.render.points', 'renderer.info.render.lines' ]
	} ];

	const _fractions = [];

	function _update() {

		const info = renderer.info;

		// WebGPURenderer counts the draw calls apart from the calls to render()
		const calls = info.render.drawCalls !== undefined ? info.render.drawCalls : info.render.calls;

		_rS( 'renderer.info.memory.geometries' ).set( info.memory.geometries || 0 );
		_rS( 'renderer.info.programs' ).set( info.programs ? info.programs.length : 0 );
		_rS( 'renderer.info.memory.textures' ).set( info.memory.textures || 0 );
		_rS( 'renderer.info.render.calls' ).set( calls || 0 );
		_rS( 'renderer.info.render.triangles' ).set( info.render.triangles || 0 );
		_rS( 'renderer.info.render.points' ).set( info.render.points || 0 );
		_rS( 'renderer.info.render.lines' ).set( info.render.lines || 0 );

	}

	function _start() {}

	function _end() {}

	function _attach( r ) {

		_rS = r;

	}

	return {
		update: _update,
		start: _start,
		end: _end,
		attach: _attach,
		values: _values,
		groups: _groups,
		fractions: _fractions
	};

}

/*
 *   From https://github.com/paulirish/memory-stats.js
 */

function BrowserStats() {

	let _rS = null;

	let memory = {
		usedJSHeapSize: 0,
		totalJSHeapSize: 0
	};

	if ( globalThis.performance && performance.memory ) memory = performance.memory;

	if ( memory.totalJSHeapSize === 0 ) {

		console.warn( 'totalJSHeapSize === 0... performance.memory is only available in Chrome .' );

	}

	const _values = {
		memory: {
			caption: 'Used Memory (MB)',
			average: true,
			avgMs: 1000
		},
		total: {
			caption: 'Total Memory (MB)'
		}
	};

	const _groups = [ {
		caption: 'Browser',
		values: [ 'memory', 'total' ]
	} ];

	const _fractions = [ {
		base: 'total',
		steps: [ 'memory' ]
	} ];

	function _size( v ) {

		return Math.round( v * 100 / 1048576 ) / 100;

	}

	function _update() {

		_rS( 'memory' ).set( _size( memory.usedJSHeapSize ) );
		_rS( 'total' ).set( _size( memory.totalJSHeapSize ) );

	}

	function _start() {}

	function _end() {}

	function _attach( r ) {

		_rS = r;

	}

	return {
		update: _update,
		start: _start,
		end: _end,
		attach: _attach,
		values: _values,
		groups: _groups,
		fractions: _fractions
	};

}

export { glStats, threeStats, BrowserStats };
