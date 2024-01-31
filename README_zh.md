# PHC

轻便的JS超文本文件组件框架。

## 有何不同？

- 使用超文本（HTML）作为开发语言，无多余知识，无高深的概念
- 快速查看组件效果，没有繁杂的构建体系
- 单文件组件：用一个.htm 文件写一个组件，独立部署到 CDN，不需要打包或编译
- Web Components: 完全基于 customElements 实现，组件被放在 shadowDOM 中，支持样式隔离，支持向组件传标准的 slot
- 没有 Virtual DOM，更新直接触达 DOM 节点
- 异步按需加载：只拉出当前界面渲染需要的组件，当前界面不需要的组件不会被拉取
- 通过`<link rel="sfc" as="custom-name">`快速链接组件
- 组件可嵌套
- 超快，底层基于vanilla.js驱动
- 超小体积，5kb
- 支持所有支持ES5的浏览器

## 例子

```html
<script src="https://unpkg.com/phc"></script>
<phc-x src="./some.htm"></phc-x>
```

## 使用方法

撰写一个some.hm文件：

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

**脚本限制**

在script部分，我们不能完全按照Web原始接口进行使用，因为这些脚本（包含通过`<script src="..">`引入的脚步）都是运行在一个沙盒中，以避免对全局的应用造成污染。其中主要的限制如下：

- 不可以直接使用window接口（如history, location等），只能把window作为一个全局变量用来作为中介
- 不可以使用window和document上的事件，因为这些事件无法按照预期运行
- 不可以通过document选取组件之外的其他内容，避免造成安全问题
- 其他未知限制

## Attributes

```html
<phc-x type="book" src="./some.htm"></phc-x>
```

```html
<script>
  const attrs = document.rootElement.attributes; // https://developer.mozilla.org/zh-CN/docs/Web/API/NamedNodeMap
  const type = attrs.type.value; // 这里`type`的值就是外面传入的属性的值，即"book"

  fetch(`some_article_url?type=${type}`).then(res => res.text()).then((text) => {
    document.querySelector('.container main').innerText = text;
  });
</script>
```

## 子组件

只需要在组件中继续使用`<phc-x>`即可引入子组件：

```html
<phc-x src="./sub.htm"></phc-x>
```

## 快速定义Web Component

通过 phc 你可以快速定义一个新的 Web Component。在你的入口html文件中使用下面的`<link>`标签来定义一个名为`react-app`的自定义元素：

```html
<link rel="phc" href="../react/react.htm" as="react-app">
```

之后，你就可以在整个应用中使用它：

```html
<react-app></react-app>
```

*注意，在异步加载的页面或脚本中再使用`<link>`无法创建自定义元素。*

**define**

你可以通过库暴露出来的`define`方法来手动定义个自定义元素。（define可在任意位置被调用，不受入口文件限制。）

```js
import { define } from 'https://unpkg.com/phc/es/index.js';
define('some-tag', '...some_url...');
```

其中`define`的第二个参数可以直接传入.htm文件的url地址。

## MIT License

Copyright (c) 2024 Shuang Tang

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
