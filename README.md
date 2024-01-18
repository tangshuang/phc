# SFCJS

Light JIT frontend view driver javascript library.

*SFC is short for `single file component`.*

## What's the difference?

- JIT: render components in runtime, without ahead compiling
- AOT: compile SFC to pure javascript file
- SFC: write a component with .htm file, deploy to CDN directly, no pack or compiling
- Web Components: based on customElements, rendering in shadowDOM, supports isolated styles/css, supports `slot` for component
- Reactive Programming: modify javascript variables to rerender UI
- Simple Syntax: following HTML syntax, define `<script>`, `<style>`, html blocks in SFC
- No Virtual DOM: modify DOM nodes directly which is relate to variables
- Responsive Styles: use javascript variables in css, and it will react changes refer to the variables
- Asnyc Demanded Loading: only load demanded component files
- Quick link customElement: a `<link rel="sfc" as="custom-name">` to link a customElement quickly

## Examples

```html
<x-sfc src="./some.htm"></x-sfc>
```

```html
<link rel="sfc" href="./some.htm" as="some-x">
<some-x></some-x>
```

```html
<head>
  <template sfc as="some-x">
    component content
  </template>
</head>
<some-x></some-x>
```

## Usage

**Step 1**: import the library file from CDN

```html
<script src="https://unpkg.com/sfcjs"></script>
```

**Step 2**: place the customElement at some where link to your SFC file

```html
<x-sfc src="https://my.cdn.com/my-component.htm"></x-sfc>
```

Later you will see the component be rendered at the place where `<x-sfc>` put.

**Step 3**: write your SFC and upload to the previous URL, here is an SFC example

```html
<script>
  import SomeComponent from 'sfc:./some.htm'; // import another SFC
  import emit from 'sfc:emit'; // import builtin emit from sfcjs

  import { each } from '../src/utils.js';


  /**
   * define some javascript variables
   * later we will use these variables in UI view
   * if we change the variables, the UI will be rendered
   */

  let name = 'app_name';
  let age = 10;

  let some = {
    name: 'name',
    height: age * 50,
  };


  /**
   * use `var` to delcare varaibles to avoid responsive
   */

  var weight = age * 2;


  /**
   * define some methods which will be used in UI view
   */

  function grow(e) {
    /**
     * change variables to rerendered
     */
    age ++;
    weight += 2;

    /**
     * emit events by using `emit`
     */
    emit('grow', age);
  }


  /**
   * define constants by `const`
   * you can use theme in UI view,
   * however, you can never change constants anywhere
   */

  const colors = [
    '#fee',
    '#ccd',
    '#a97',
  ];
</script>

<style>
  .name {
    color: #ffe;
  }

  .age {
    color: rgb(
      /**
       * use javascript expressions which contain previous variables in var('{{ ... }}')
       * the used varaibles changed, the styles will be changed too
       */
      var('{{ age * 5 > 255 ? 255 : age * 5 }}'),
      var('{{ age * 10 > 255 ? 255 : age * 10 }}'),
      var('{{ age * 3 > 255 ? 255 : age * 3 }}')
    );
    /**
     * use previous variables by as expression `([...])`
     */
    font-size: ([age])px;
  }
</style>

<div class="app-{{name}}">
  <div>name: <span>{{name}}</span></div>
  <div
    class="age"
    (class)="'age-' + age"
    (style)="age > 13 ? 'font-weight: bold;' : null"
    (if)="age > 10"
  >age: {{age}}</div>
  <div (repeat)="color,index in colors" (if)="!!color" (key)="color">
    <i>{{index}}: {{color}}</i>
  </div>
  <button @click="grow(event)">grow</button>
  <some-component
    :title="'xxx'"
    :some-attr="age * 5 > 10 ? 'ok' : null"
  ></some-component>
</div>
```

Notice: you should must write tail semicolon at the end of a sentence.
Notice: only one root HTML tag supported, you can use `<fragment>` as the root tag to contain mutiple elements.

## x-sfc

In sfcjs, you will use `<x-sfc>` to bootstrap a remote SFC quickly.

```html
<x-sfc src="https://my.cdn.com/my-component.htm"></x-sfc>
```

It supports the following attributes:

- src: the SFC file path, relative or absolute path both supported
- passive: disable immediately rendering, you should must invoke `document.querySelector('x-sfc#app').mount()` to setup rendering
- pending-slot: is to treat slot as pendding content before the SFC file loaded
- attributes start with `:` or `data-` will be used as props to pass into SFC
- attributes not start with `:` or `data-` are not related, which is just for current custom element

You can use `addEventListener` to listen the events which are emitted inside SFC. The parameter is a CustomEvent, you can read `event.detail` to get the emitted value.

```html
<x-sfc src="..." pending-slot="1" passive="1" :prop1="{ name: 1 }" data-prop2="true" class="some">Loading...</x-sfc>

<script>
  const some = document.querySelector('.some');
  some.addEventListener('anyEventName', e => console.log(e.detail));
  some.mount();
</script>
```

## Template Syntax

- `{{ ... }}` is to generate string by given variables
- `@` started attributes are events bindings, i.e. `@click="handle(event)"`
- `:` started attributes are props passing, which pass real value, only work for sub components
- `(..)` started attributes are directive

**directives**

- (if): `<div (if)="someVar === 1">`
- (class): `<div class="default-class" (class)="age > 10 ? 'dynamic-class' : ''">`
- (style): `<div style="color: red" (style)="age > 10 ? 'font-size: 12px' : ''">`
- (src)、(href): `<img (src)="./xxx.jpg" />` `<a href="..">`. `src` and `href` will make the relative path to right absolute path. Notice, the values are string, not expression.
- (repeat): `<div (repeat)="item,index in items" (key)="item.id">{{item.text}}</div>`. `index` is optional
- (key): always works with `repeat`, to identify a node in a list
- (bind): `<input (bind)="word" />` two way binding, only works for `<input>` `<textarea>` `<select>`. `<textarea (bind)="description"></textarea>`

## Responsive Styles

In `<style>` block, you can refer declared javascript variables to generate css rules. When the refered variables change, the styles will be update too.

```html
<script>
let age = 10;

function grow() {
  age ++;
}
</script>

<style>
  .age {
    color: rgb(
      /* First Pattern */
      var('{{ age * 5 > 255 ? 255 : age * 5 }}'),
      var('{{ age * 10 > 255 ? 255 : age * 10 }}'),
      var('{{ age * 3 > 255 ? 255 : age * 3 }}')
    );
    /* Second Pattern */
    font-size: ([age])px;
  }
</style>
```

First Pattern:

```
var('{{ expression }}')
margin-right: var("{{ age + 'px' }}")
```

Second Pattern:

```
([age])
font-size: ([age])rem
```

In this pattern, only a variable can be put (not expression).

**import**

When you add `sfc:` protool prefix before an imported path, the css file will be built into bundle. For example:

```html
<style>
  @import "sfc:../shared/var.css";
</style>
```

## Link

```html
<head>
  <script src="https://unpkg.com/sfcjs"></script>
  <link rel="sfc" href="./some.htm" as="x-some" />
</head>

<x-some></x-some>
```

Set `rel="sfc"` and `as="x-some"` for a `<link>` to load the component as a customElement. You can set `delay` attribute on link tag to load the component later after document loaded.

## Template

SFCJS 支持在应用（而非组件）当前 html 中用 template 提前定义组件。例如：

```html
<head>
  <script src="https://unpkg.com/sfcjs"></script>
  <template sfc as="x-some">
    <script>
      let a = 1;
    </script>
    <span>{{a}}</span>
  </template>
<head>

<x-some></x-some>
```

Set `sfc` and `as="x-some"` for a `<template>` to define a component and write component code inside the template tag.

## API

**global variable**

```html
<script src="https://unpkg.com/sfcjs"></script>
<script>
  const { SFCJS } = window;
</script>
```

**register**

Register a component with given code (when you do not need to load code from remote).

```html
<script>
  SFCJS.register('./some.htm', `
    <script>
      let a = 1;
    </script>
    <span>{{a}}</span>
  `);
</script>

<x-sfc src="./some.htm"></x-sfc>
```

```ts
declare function register(
  /** component src */
  src: string,
  /** component code */
  code: string,
  options?: {
    /** customElement name */
    tag?: string,
  },
)
```

**privilege**

Define a customElement.

```js
SFCJS.privilege(
  't-button',
  {
    props: {
      type: 'type',
      theme: 'theme',
    },
  },
  `
    <script>
      const { type, theme } = await import('sfc:props');
    </script>
    <style>
      button.success {
        background: green;
        color: #fff;
      }
      button.error {
        background: red;
        color: #fff;
      }
    </style>
    <button type="{{type}}" class="{{theme}}"><slot /></button>
  `,
);
```

```html
<t-button type="button" theme="error">Submit</t-button>
```

```ts
declare function privilege(
  tag: string,
  options?: {
    src?: string,
    /** props mapping, i.e { s: 'some' } -> <x-some s="xx"> -> props.some */
    props?: { [key: string]: string },
    /** events mapping */
    events?: { [key: string]: string },
    onInit?,
    onConnect?,
    onMount?,
    onDestroy?,
    onChange?,
  },
  code?: string,
)
```

*Notice: src or code should must be passed.*

```js
SFCJS.privilege(
  't-button',
  {
    src: './button.htm',
  },
);
```

## Subcomponent

Import subcomponent by sfc: protool:

```html
<script>
import SomeComponent from 'sfc:./some-component.htm';
</script>

<some-component></some-component>
```

**props**

```html
<script>
import props from 'sfc:props';
</script>

<div id="{{props.id}}">{{props.content}}</div>
```

```html
<some-component :id="100" :content="'some string'" class="some"></some-component>
```

Subcomponent only receive props, attrs are not able to receive. In the previous code, `class="some"` are not passed into subcomponent.

**events**

```js
import emit from 'sfc:emit';

function handleClick() {
  emit('triggered', 111)
}
```

```html
<some-component @triggered="handleTrigger(event)"></some-component>
```

**others**

- resolve(uri: string)
- query(selector: string): query a DOM node
- computed(getter: () => any): create a computed variable
- update(): update UI manually
- watch(vars, callback: (next, prev) => void)

## AOT

```js
const { bundle } = require('sfcjs/bunlder')
const code = bundle(file, options)
```

```ts
declare function bundle(
  file: string,
  options: {
    /** the visit url of this component after deploy, default `/{filename}` */
    entryUrl: string,
    /** the root path of absolute path when we call `sfc:/some.htm` */
    absRootPath: string,
    /** the output file place, default to absRootPath */
    outputDir: string,
    /** whether build `import 'sfcjs';` inside bundle */
    importLib?: boolean,
    /** alias component relative src to absolute path, for exmaple: ./some.htm -> /some/path/to/some.htm */
    alias: { [key: string]: string },
  },
)
```

webpack loader:

```js
const { bundle } = require('sfcjs/bunlder')
module.exports = function(content) {
  const file = this.resourcePath;
  const options = this.getOptions();
  const code = bundle(file, options);
  // Notice, code is ESModule, so this loader should be put after babel-loader
  return code;
};
```

## vscode

- [JSON Script Tag](https://marketplace.visualstudio.com/items?itemName=sissel.json-script-tag) supports `<script type="application/json">`
- [Vue Language Features (Volar)](https://marketplace.visualstudio.com/items?itemName=johnsoncodehk.volar) supports template

## License

MIT
