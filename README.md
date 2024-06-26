# PHC

Light Javascript Hypertext File Component Framework.

## What's the difference?

- Use Hypertext as development language, without any higher knowlege or concepts more than Web.
- Run component as quickly as possible, without any build tool chain.
- SFC: write a component with .htm file, deploy to CDN directly, no pack or compiling
- Web Components: based on customElements, rendering in shadowDOM, supports isolated styles/css, supports `slot` for component
- No Virtual DOM: modify DOM nodes directly
- Asnyc Demanded Loading: only load demanded component files
- Quick link: a `<link rel="sfc" as="custom-name">` to link a customElement quickly
- Nested component system
- Fast, vanilla.js as underlying driver
- Small and light, 5kb

## Examples

```html
<script src="https://unpkg.com/phc"></script>
<phc-x src="./some.htm"></phc-x>
```

## Write a component

Write a `some.htm` file with Hypertext

```html
<style>
.container {
  margin: 10px;
}
</style>

<div class="container">
  <main></main>
</div>

<script>
  fetch('some_article_url').then(res => res.text()).then((text) => {
    document.querySelector('.container main').innerText = text;
  });
</script>
```

**Script Limitation**

In `script` part, we CANNOT use Web native API, because the scripts (includes `<script src="...">`) are all running in a code sandbox. The limitation:

- Some Window API should not be used, includes `history`, `location` or any others, `window` can only be used as a global object to share data
- Events of window and docuements are not worked as expected
- You cound not select elements outside the component
- Other unknown limitation

## Attributes

```html
<phc-x type="book" src="./some.htm"></phc-x>
```

```html
<script>
  const attrs = document.rootElement.attributes; // https://developer.mozilla.org/zh-CN/docs/Web/API/NamedNodeMap
  const type = attrs.type.value; // here `type` is the passed attribute whose value is `book`

  fetch(`some_article_url?type=${type}`).then(res => res.text()).then((text) => {
    document.querySelector('.container main').innerText = text;
  });
</script>
```

## Subcomponent

Just continue write `<phc-x>` in a component file:

```html
<phc-x src="./sub.htm"></phc-x>
```

## Quick define custom element

Use `<link>` in your entry html file to define a custom element named `react-app`:

```html
<link rel="phc" href="../react/react.htm" as="react-app">
```

Then you can use the custom element any where in your application:

```html
<react-app></react-app>
```

*Notice, you can not load a new custom element by async files or scripts any more.*

**define**

Use `define` to setup a custom element at anywhere.

```js
import { define } from 'https://unpkg.com/phc/es/index.js';
define('some-tag', '...some_url...');
```

## getOutsideContext

In a PHC file, you can import the phc library file to get outside context:

```html
<!-- inside phc -->
<script src="https://unpkg.com/phc"></script>
<script>
const { getOutsideContext } = window.phc;
const context = getOutsideContext();
/**
 * {
 *   window,
 *   document,
 *   rootElement,
 *   shadowRoot,
 * }
 */
</script>
```

## MIT License

Copyright (c) 2024 Shuang Tang

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
