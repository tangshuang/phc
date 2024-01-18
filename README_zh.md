# PHC

轻便的JS超文本文件组件框架。

## 有何不同？

- 使用超文本（HTML）作为开发语言，无多余知识，无高深的概念
- 快速查看组件效果，没有繁杂的构建体系
- 单文件组件：用一个.htm 文件写一个组件，独立部署到 CDN，不需要打包或编译
- Web Components: 完全基于 customElements 实现，组件被放在 shadowDOM 中，支持样式隔离，支持向组件传标准的 slot
- 没有 Virtual DOM，更新直接触达 DOM 节点，只有依赖了被修改变量的 DOM 节点会被更新
- 异步按需加载：只拉出当前界面渲染需要的组件，当前界面不需要的组件不会被拉取
- 通过`<link rel="sfc" as="custom-name">`快速链接组件
- 组件可嵌套
- 超快，底层基于vanilla.js驱动
- 超小体积，5kb
- 支持所有支持ES5的浏览器

## 例子

```html
<script src="https://unpkg.com/phc"></script>

<link rel="phc" href="./some.htm" as="some-x" />

<some-x></some-x>
```

## 使用方法

第一步，撰写一个.hm文件：

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
  // 此处继续往下阅读
</script>
```

第二步：使用`Document`来引用组件的上下文

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
  const type = attrs.type.value; // 这里`type`的值就是外面传入的属性的值，即"book"

  fetch(`some_article_url?type=${type}`).then(res => res.text()).then((text) => {
    doc.querySelector('.container main').innerText = text;
  });
</script>
```

## 子组件

只需要在组件中按下面方法撰写即可引入子组件：

```html
<link rel="phc" href="./sub.htm" as="sub-x" />
<sub-x></sub-x>
```

## MIT License

Copyright (c) 2024 Shuang Tang

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.