## aframe-dynamic-resolution

A component for [A-Frame](https://aframe.io) that allows to control resolution dynamically.

### Properties

| Property | Description | Default Value |
| -------- | ----------- | ------------- |
| targetFPS | The target fps that you except. | 60          |
| debug | If true, component will print info when scale changes. | false    |

### Usage

#### Browser Installation
Install and use by directly including the [browser files](dist):

```html
    <script src="../dist/aframe-dynamic-resolution.js"></script>
```
Then attach the component to a-scene:
```html
    <a-scene stats dynamic-resolution="debug:true;">
    ...
    </a-scene>
```
#### NPM Installation
Install via NPM:

```bash
npm install https://github.com/islxyqwe/aframe-dynamic-resolution
```

Then register and use.

```js
require('aframe');
require('aframe-dynamic-resolution');
```

### Extend Component

If you want to change behavior of this component, just change its resolution_controller property.
```js
import { Component } from 'aframe-dynamic-resolution';
import { bufferCount, map } from 'rxjs/operators'
Component.prototype.resolution_controller = function(ob){
    ob.pipe(
    	bufferCount(4),
    	map(a=>a.reduce((x,y)=>x+y)/4),
        map(x=>x * this.data.targetFPS / 1000),
        map(x=>1+(1-x)*0.01)
    )
    .subscribe(x=>this.scale = this.scale * x);
}
```