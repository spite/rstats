# rStats

rStats aims to provide a way of measuring and visualizing performance of your code, mainly in apps based on an update loop, like games or interactive experiences.

[![npm](https://img.shields.io/npm/v/rstatsjs.svg)](https://www.npmjs.com/package/rstatsjs)

#### Demos ####
- **[Introduction](https://spite.github.io/rstats/)**: what rStats does, step by step, with every example running in the page
- **[rStats measuring a three.js scene](https://spite.github.io/rstats/demo/)**: the time of each part of the frame, the WebGL calls, what three.js reports and the memory

<a href="https://spite.github.io/rstats/demo/"><img src="https://raw.githubusercontent.com/spite/rstats/master/demo/header.jpg" alt="rStats" width="100%"/></a>

#### 2026 update ####
**Disclaimer:** this library is from 2014. Browsers and three.js have their own tools for most of this now, so check those first

The Performance panel of the browser shows where the time of a frame goes, and anything measured with `performance.measure()` shows up in it. three.js has `renderer.info` with the draw calls and the triangles of a frame, ships `stats.js` in its addons (`three/addons/libs/stats.module.js`) for the framerate, and with `WebGPURenderer` there's an `Inspector` in the addons since r181 (2025).

What rStats is still good for: a panel in the page, that works on any device, with the counters you choose, the fraction of the frame that each part of your code takes, and alarms when a value goes over its budget.

The library has been updated. What changed from the 2014 version:

- it's an ES module, and it's what the npm package exports. ```require('rstatsjs')``` used to fail, the package pointed to a file that wasn't there
- the styles are part of the library. There's no ```rStats.css``` to serve next to the page anymore, ```CSSPath``` is gone, and no font is loaded from Google Fonts
- the WebGL plugin works with WebGL 2, which is what three.js uses. It only counted the calls of WebGL 1, so everything was zero. It counts instanced draws too
- the three.js plugin shows triangles, points, lines and programs. Faces and vertices were ```NaN``` since three.js removed them from ```renderer.info```
- the memory is shown in MB. It used to change units without saying so
- the panel only touches the page when a number changes, it used to rewrite every value on every frame
- there's ```hide()```, ```show()``` and ```destroy()```
- counters have ```mark()```, to count how many times per second something happens
- ```userTimingAPI``` adds measures without leaving marks behind. It used to add two marks per counter and frame, forever
- ```warningColor``` of a counter works, it was documented and never used
- the settings you pass are not modified, and a plugin doesn't need to have groups or fractions

#### How to use ####
Use npm to install it
```
npm i rstatsjs
```
and import it in your code
```js
import { rStats } from 'rstatsjs';
```
It's a plain ES module, so it also works without a bundler (see [demo/index.html](demo/index.html)).

Create an rStats object:
```js
const rS = new rStats();
```
Using it is as simple as placing the elements you'd like to measure in your update/render method:
```js
function render() {

  rS( 'frame' ).start();

  /* Do rendery stuff */

  rS( 'frame' ).end();
  rS().update();

  requestAnimationFrame( render );

}
```
```rS( id )``` returns a counter, creating it the first time. The ids are case-insensitive. A counter has six updating methods:

- ```start()```: starts counting performance time.
- ```end()```: stops counting performance time and stores the ellapsed time since ```start()``` was called. Good to measure render or texture update time.
- ```tick()```: stores the ellapsed time since ```tick()``` was last called. It's a shortcut for ```end(); start();```. Good to measure times of loops or time between calls.
- ```frame()```: counts a frame, and stores the frames per second once every second. Good for ... well, framerate, for instance.
- ```set( v )```: stores the specified value. Good to store specific values, like draw calls or memory size.
- ```mark( n )```: counts something that happened, ```n``` times or once, and stores how many per second once every second. The value falls to zero when it stops happening. Good for things that don't follow the update loop, like collisions or messages from a worker.

Additionally, ```value()``` returns the current value of the counter.

```js
worker.addEventListener( 'message', function ( e ) {

  rS( 'messages' ).mark();

} );
```
The rate of a counter that uses ```mark()``` is calculated in ```update()```, so keep calling it in your loop.

```rS()``` returns the rStats object itself:

- ```update()```: redraws the panel. Call it at the end of your update function.
- ```element```: the element of the panel, to place it somewhere else. It's at the top left of the page by default.
- ```hide()``` and ```show()```: hide the panel and show it again. A hidden panel is not redrawn.
- ```destroy()```: removes the panel from the page.

A more extensive example:
```js
function render() {

  rS( 'frame' ).start();
  rS( 'rAF' ).tick();
  rS( 'FPS' ).frame();

  rS( 'action1' ).start();
  /* Perform action #1 */
  rS( 'action1' ).end();

  rS( 'render' ).start();
  /* Perform render */
  rS( 'render' ).end();

  rS( 'frame' ).end();
  rS().update();

  requestAnimationFrame( render );

}
```
In this example, we're using

- ```rS( 'frame' ).start()/end()``` to measure the actual execution time of our render method
- ```rS( 'rAF' ).tick()``` to measure how close to 16ms our requestAnimationFrame callbacks are being triggered
- ```rS( 'FPS' ).frame()``` to count the framerate
- ```rS( 'action1' ).start()/end()``` and ```rS( 'render' ).start()/end()``` to measure execution time of those parts of the render

The graphs slowly accommodate to the max value: the scale grows and shrinks over time to adjust the vertical axis.

#### Captions, alarms and averages ####
Using short ids like ```rAF``` is useful when writing code, but it makes the panel look a bit awful. You can add captions for your counters when creating the rStats object, and alarms to quickly identify potential problems: the graph and the caption turn red when the value goes over or below a threshold.
```js
const rS = new rStats( {
  values: {
    frame: { caption: 'Total frame time (ms)', over: 16 },
    raf: { caption: 'Time since last rAF (ms)' },
    fps: { caption: 'Framerate (FPS)', below: 30 },
    action1: { caption: 'Render action #1 (ms)', average: true, avgMs: 100 },
    render: { caption: 'WebGL Render (ms)' }
  }
} );
```
```values``` is an object with the ids of the counters and their properties:

- ```caption```: the text shown in the panel
- ```over``` and ```below```: the thresholds of the alarm
- ```average```: show the value averaged over some time, and ```avgMs```: the number of ms over which it's averaged (1000 by default)
- ```interpolate```: set it to ```false``` in a counter that uses ```frame()``` or ```mark()``` to show what was counted, without scaling it to a second
- ```color``` and ```warningColor```: the colours of the graph, and of the graph while the alarm is on

#### Groups ####
Counters can be clustered in categories. Clicking on the name of a group opens and closes it.
```js
const rS = new rStats( {
  values: {
    frame: { caption: 'Total frame time (ms)', over: 16 },
    raf: { caption: 'Time since last rAF (ms)' },
    fps: { caption: 'Framerate (FPS)', below: 30 },
    action1: { caption: 'Render action #1 (ms)' },
    render: { caption: 'WebGL Render (ms)' }
  },
  groups: [
    { caption: 'Framerate', values: [ 'fps', 'raf' ] },
    { caption: 'Frame Budget', values: [ 'frame', 'action1', 'render' ] }
  ]
} );
```

#### Fractions ####
When a process is split in smaller steps, it's interesting to see the percentage of the whole time that each step takes.
```js
const rS = new rStats( {
  fractions: [
    { base: 'frame', steps: [ 'action1', 'render' ] }
  ]
} );
```
This adds a stacked area chart: the value of the counter in ```base``` is the 100%, and the values of the counters in ```steps``` are scaled to it.

#### Plugins ####
There are three plugins in ```rstatsjs/extras```: one for three.js, one for WebGL and one for the memory of the browser.
```js
import { rStats } from 'rstatsjs';
import { glStats, threeStats, BrowserStats } from 'rstatsjs/extras';

const glS = new glStats(); // init at any point
const tS = new threeStats( renderer ); // init after the renderer is created
const bS = new BrowserStats();

const rS = new rStats( {
  values: {
    frame: { caption: 'Total frame time (ms)', over: 16 },
    fps: { caption: 'Framerate (FPS)', below: 30 }
  },
  plugins: [ tS, glS, bS ]
} );
```
The three.js plugin is transparent, but the WebGL one needs the start of the frame to be signaled, it resets the counters:
```js
function render() {

  rS( 'frame' ).start();
  glS.start();

  /* ... */

  rS( 'frame' ).end();
  rS().update();

  requestAnimationFrame( render );

}
```
- ```glStats``` hooks the WebGL contexts of the page and counts draw calls, ```useProgram```, ```bindTexture```, faces, vertices and points. It works with anything that uses WebGL.
- ```threeStats``` shows ```renderer.info```: geometries, textures, programs, calls, triangles, points and lines. three.js resets the render values on every call to ```render()```, so with several passes set ```renderer.info.autoReset = false``` and call ```renderer.info.reset()``` once per frame.
- ```BrowserStats``` shows the memory of the page, in MB. It uses ```performance.memory```, which only Chrome has.

A plugin is an object with ```attach( rS )```, called once with the function that returns the counters, ```update()```, called on every update of the panel, and optionally ```values```, ```groups``` and ```fractions``` to add to the settings.

#### Other settings ####
- ```userTimingAPI```: set it to ```true``` and every ```start()/end()``` is added to the User Timing API with ```performance.measure()```, so the counters show up in the Performance panel of the browser
- ```parent```: the element the panel is added to, the body by default
- ```colours```: the colours of the fractions
- ```css```: URLs of stylesheets to load, like a font. The panel uses Roboto Condensed if the page has it

The classes of the panel start with ```rs-```, to change how it looks from your own CSS.

# Credits

It takes after [mrdoob stats.js](https://github.com/mrdoob/stats.js/), [Jerome Etienne's threex.rendererstats](https://github.com/jeromeetienne/threex.rendererstats) and [Ben Vanik's WebGL Inspector](http://benvanik.github.io/WebGL-Inspector/).

Jaume Sanchez Elias [@thespite](http://www.twitter.com/thespite)  
[www.clicktorelease.com](http://www.clicktorelease.com)

#### License ####

MIT licensed

Copyright (C) 2014 Jaume Sanchez Elias, http://www.clicktorelease.com
