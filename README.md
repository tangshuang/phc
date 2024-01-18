# PHC

Light Javascript Hypertext File Component Framework.

## What's the difference?

- Use Hypertext as development language, without any higher knowlege or concepts more than Web.
- Run component as quickly as possible, without any build tool chain.
- SFC: write a component with .htm file, deploy to CDN directly, no pack or compiling
- Web Components: based on customElements, rendering in shadowDOM, supports isolated styles/css, supports `slot` for component
- No Virtual DOM: modify DOM nodes directly which is relate to variables
- Asnyc Demanded Loading: only load demanded component files
- Quick link: a `<link rel="sfc" as="custom-name">` to link a customElement quickly
- Nested component system
- Fast, vanilla.js as underlying driver
- Small and light, 5kb
- Support browsers with ES5

## Examples

```html
<script src="https://unpkg.com/phc"></script>

<link rel="phc" href="./some.htm" as="some-x" />

<some-x></some-x>
```

## Write a component

**Step 1**: write a `some.htm` file with Hypertext

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
  // read step 2
</script>
```

**Step 2**: use `Document` to call context

```html
<script>
  const doc = new Document();

  fetch('some_article_url').then(res => res.text()).then((text) => {
    doc.querySelector('.container main').innerText = text;
  });
</script>
```

## Attributes

```html
<some-x type="book"></some-x>
```

```html
<script>
  const doc = new Document();
  const attrs = doc.rootElement.attributes; // https://developer.mozilla.org/zh-CN/docs/Web/API/NamedNodeMap
  const type = attrs.type.value; // here `type` is the passed attribute whose value is `book`

  fetch(`some_article_url?type=${type}`).then(res => res.text()).then((text) => {
    doc.querySelector('.container main').innerText = text;
  });
</script>
```

## Subcomponent

Just write in a component file:

```html
<link rel="phc" href="./sub.htm" as="sub-x" />
<sub-x></sub-x>
```

## MIT License

Copyright (c) 2024 Shuang Tang

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.