import { registerComponent, Scene } from 'aframe'
import { Observable, Subscriber } from 'rxjs'
import { bufferCount, map, filter } from 'rxjs/operators'
const Component = registerComponent('dynamic-resolution', {
  schema: {
    targetFPS: {
      default: 60
    },
    debug: {
      default: false
    }
  },
  timer: 0,
  scale: 1,
  handler: new Subscriber<number>(),
  /** anyway to convert rAF stream to resolution control stream */
  resolution_controller(source: Observable<number>) {
    return source
      .pipe(
        bufferCount(4),
        map(a => (a.reduce(add) * this.data.targetFPS) / 4000 - 1),
        filter(x => x < 1),
        map(a => (a > 0 ? a * 5 : Math.log(-a) * 0.2)),
        seesaw(60),
        map(x => x < 0)
      )
      .subscribe(x => {
        if (x && this.scale < 1) {
          this.scale = this.scale + 0.05
        } else if (!x && this.scale > 0.75) {
          this.scale = this.scale - 0.05
        } else {
          return
        }
        if (this.data.debug) {
          console.log('change scale to', this.scale)
        }
      })
  },
  init() {
    this.timer = performance.now()
    this.resolution_controller(
      new Observable<number>(ob => {
        this.handler = ob
      })
    )
  },
  play() {
    this.timer = performance.now()
  },
  remove() {
    this.handler.complete()
  },

  tick() {
    const frametime = performance.now() - this.timer
    this.handler.next(frametime)
    this.resize()
    this.timer = performance.now()
  },
  /** change scale. lags when scale changes */
  resize() {
    const scene = this.el as Scene & { maxCanvasSize: Size }
    const canvas = scene.canvas
    const embedded = scene.getAttribute('embedded') && !scene.is('vr-mode')
    const size = getCanvasSize(canvas, embedded, scene.maxCanvasSize, scene.is('vr-mode'))
    scene.renderer.setSize(size.width * this.scale, size.height * this.scale, false)
  }
})
export { Component }

const seesaw = (size: number) => (source: Observable<number>) =>
  new Observable<number>(ob => {
    let balance = 0
    return source.subscribe({
      next(x) {
        if (balance === 0 || (balance > 0 && x > 0) || (balance < 0 && x < 0)) {
          balance = balance + x
        } else {
          balance = balance / 10 + x
        }
        if (Math.abs(balance) > size) {
          ob.next(balance)
          balance = 0
        }
      },
      error(err) {
        ob.error(err)
      },
      complete() {
        ob.complete()
      }
    })
  })

function add(x: number, y: number) {
  return x + y
}

// code from https://raw.githubusercontent.com/aframevr/aframe/v0.9.0/src/core/scene/a-scene.js
interface Size {
  width: number
  height: number
}
function getCanvasSize(canvasEl: HTMLCanvasElement, embedded: boolean, maxSize: Size, isVR: boolean) {
  if (embedded) {
    if (canvasEl.parentElement) {
      return {
        height: canvasEl.parentElement.offsetHeight,
        width: canvasEl.parentElement.offsetWidth
      }
    }
  }
  return getMaxSize(maxSize, isVR)
}
function getMaxSize(maxSize: Size, isVR: boolean) {
  let aspectRatio
  let size
  const pixelRatio = window.devicePixelRatio

  size = { height: document.body.offsetHeight, width: document.body.offsetWidth }
  if (!maxSize || isVR || (maxSize.width === -1 && maxSize.height === -1)) {
    return size
  }

  if (size.width * pixelRatio < maxSize.width && size.height * pixelRatio < maxSize.height) {
    return size
  }

  aspectRatio = size.width / size.height

  if (size.width * pixelRatio > maxSize.width && maxSize.width !== -1) {
    size.width = Math.round(maxSize.width / pixelRatio)
    size.height = Math.round(maxSize.width / aspectRatio / pixelRatio)
  }

  if (size.height * pixelRatio > maxSize.height && maxSize.height !== -1) {
    size.height = Math.round(maxSize.height / pixelRatio)
    size.width = Math.round((maxSize.height * aspectRatio) / pixelRatio)
  }

  return size
}
