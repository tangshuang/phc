# SFCJS

轻便的前端 JIT 视图层驱动框架。

*SFC 是 single file component 的缩写。*

## 有何不同？

- JIT: 运行时直接渲染组件，不需要编译工具（同时也支持 AOT 编译，开发者可根据自己需求选择）
- 单文件组件：用一个.htm 文件写一个组件，独立部署到 CDN，不需要打包或编译
- Web Components: 完全基于 customElements 实现，组件被放在 shadowDOM 中，支持样式隔离，支持向组件传标准的 slot
- 响应式编程：修改 js 变量来触发界面更新
- 组件类似 svelte 风格，在组件中定义 script, style, html，修改变量触发界面更新
- 没有 Virtual DOM，更新直接触达 DOM 节点，只有依赖了被修改变量的 DOM 节点会被更新
- 响应式样式编程：动态生成纯的 css，在 style 语句块中使用 js 变量，当 js 变量发生变化时对应的样式发生变化
- 异步按需加载：只拉出当前界面渲染需要的组件，当前界面不需要的组件不会被拉取

## 使用方法

第一步，撰写组件文件：

```html
<script>
  import SomeComponent from 'sfc:./some.htm'; // 导入另外一个组件
  import emit from 'sfc:emit'; // 从 sfcjs 导入 emit 方法

  import { each } from '../src/utils.js';

  // 变量是响应式的，
  // 当变量发生变化时，界面也会跟着变化

  let name = 'app_name';
  let age = 10;

  let some = {
    name: 'name',
    height: age * 50,
  };

  // 使用 `let` 声明具有响应式效果的变量
  // 使用 `var` 声明没有响应式效果的变量
  var weight = age * 2;

  function grow(e) {
    // 修改变量来触发重新渲染
    age ++;
    weight += 2;
    emit('grow', age);
  }

  // 常量永远不会变化
  // 注意：常量内部属性值也不会变化，如果需要变化，请使用 let 声明
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
      /* 在 var('{{ ... }}') 中使用 js 表达式 */
      var('{{ age * 5 > 255 ? 255 : age * 5 }}'),
      var('{{ age * 10 > 255 ? 255 : age * 10 }}'),
      var('{{ age * 3 > 255 ? 255 : age * 3 }}')
    );
    /* 在 ([...]) 中使用变量名 */
    font-size: ([age])px;
  }

  /**
   * 当 age 变化时，样式也会变化
   */
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

**注意：script 部分句尾的分号是必须的，否则无法正确解析。这一决定保证了我们所有开发者写作习惯的一致性。**
*注意：模板部分，只能有一个顶级的 html 标签，你可以使用 `fragment` 标签作为一个虚拟的标签包含多个顶级标签。*

第二步：将写好的组件文件部署到服务器 / CDN 上（非同域调用时，需要支持跨域）。

第三步：在应用入口文档（index.html）头部加载框架脚本：

```html
<head>
  ...
  <script src="https://unpkg.com/sfcjs"></script>
</head>
```

第四步：在需要使用该组件的应用中引入：

```html
<x-sfc src="https://my.cdn.com/my-component.htm"></x-sfc>
```

完成上面步骤，你就可以在放置 `x-sfc` 的位置看到组件的渲染结果。

## 自定义标签元素

在 sfcjs 中，你需要通过 `<x-sfc>` 标签来启动一个组件。

```html
<x-sfc src="https://my.cdn.com/my-component.htm"></x-sfc>
```

*由于 custom element 必须由-两个单词组成，因此在 `sfc` 后面加上 `x` 作为后缀，标签名为 `<x-sfc>`。*

`x-sfc` 元素支持如下属性：

- src: 组件相对于当前页面的相对路径或绝对路径（如果你的应用是 SPA，推荐使用绝对路径）
- passive: 是否需要**禁用**立即渲染视图，这样可以方便有些情况下，你不想马上渲染组件效果。在某个动作之后需要手动调用 `document.querySelector('x-sfc#app').mount()` 来渲染视图
- pending-slot: 是否使用传入的 slot 作为组件加载完成之前的预览信息，默认为 `0`，你可以传入 `pending-slot="1"` 来开启，开启后组件加载期间 slot 将被展示，可作为预加载提示界面
- 以 `:` 或 `data-` 开头的属性将作为组件的 props 进行传入，这些属性的值必须是 JSON 字符串，内部才能正常解析。提供 `data-` 的选项是为了避免在 vue, react 中无法使用 `:` 开头的属性。
- 其他不是 `:` 或 `data-` 开头的属性将和组件无关，是 custom element 的属性。

`x-sfc` 元素可以通过 `addEventListener` 监听组件内抛出的事件，监听得到的是一个 CustomEvent，可通过 `event.detail` 属性读取组件内抛出的值。

```html
<x-sfc src="..." pending-slot="1" passive="1" :prop1="{ name: 1 }" data-prop2="true" class="some">这段内容会在一开始被展示出来，Loading...</x-sfc>

<script>
  const some = document.querySelector('.some');
  some.addEventListener('anyEventName', e => console.log(e.detail));
  some.mount();
</script>
```

## 在 worker 中编译

默认编译过程是在主线程中，如果你希望通过 worker 线程来进行编译，从而避免编译过程占用主线程资源，你可以这样使用：

```html
<script src="https://unpkg.com/sfcjs/dist/index.js"></script>
```

使用 `dist` 目录下的脚本文件即可开启 worker 模式。此时，引入框架的 `script` 标签上，支持如下属性：

- worker-src: `<script src="https://unpkg.com/sfcjs/dist/index.js" worker-src="https://unpkg.com/sfcjs/dist/worker.js"></script>`, 默认可以不传，框架内部会基于 currentScript.src 自动读取当前目录下的脚本作为 worker.js 文件，但某些情况下，你的项目中 worker 文件的路径或文件名重新进行了修改，此时你可以传入自己改编过的 worker 文件来进行编译工作。

## 模板语法

模板语法主要有：

- 将引用变量的表达式放在 `{{ ... }}` 中，在 html 中动态生成字符串
- 以 `@` 开头的 html 属性表示事件绑定，和 vue 有点像，例如 `@click="xx(event)"`
- 以 `:` 开头的html属性表示传给组件真实值（而非字符串），只对组件有用
- 用 `(..)` 括起来的属性是指令(directive)，目前仅支持下文列出的指令，暂不支持自定义指令

**指令**

- (if): `<div (if)="someVar === 1">` 条件判断是否生成该块
- (class): `<div class="default-class" (class)="age > 10 ? 'dynamic-class' : ''">` 样式类名，被合并到已有的 class 中
- (style): `<div style="color: red" (style)="age > 10 ? 'font-size: 12px' : ''">` 样式表（字符串），被合并到已有的 sytle 中
- (src)、(href): `<img (src)="./xxx.jpg" />` `src` 和 `href` 两个指令会根据真实路径读取到正确的路径，帮助你写代码时只关注当前组件，**注意：其值为字符串，而非变量。**
- (repeat): `<div (repeat)="item,index in items" (key)="item.id">{{item.text}}</div>` 循环，`items` 是一个变量，这句话表示遍历 `items`，其中 `index` 是可选的
- (key): 一般和 `repeat` 一起用，用以标记标签唯一性，确保变化时的顺序
- (bind): `<input (bind)="word" />` 双向数据绑定，只对 `<input>` `<textarea>` `<select>` 有效，不要传入默认值，例如 `<textarea (bind)="description"></textarea>`（没有传默认值，bind 会默认填充）

## 动态样式

在 `<style>` 中可以直接引用 js 变量，当变量发生变化的时候，对应的样式值也发生变化。

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
      /* 第一种使用方法 */
      var('{{ age * 5 > 255 ? 255 : age * 5 }}'),
      var('{{ age * 10 > 255 ? 255 : age * 10 }}'),
      var('{{ age * 3 > 255 ? 255 : age * 3 }}')
    );
    /* 第二种使用方法 */
    font-size: ([age])px;
  }
</style>
```

第一种使用方法：

```
var('{{ 这里使用表达式 }}')
```

对于需要动态计算的表达式可以使用这种方法，其使用规则遵循 css 变量，因此，如果是带有单位的，应该在表达式部分把单位拼出来，例如：

```
var("{{ age + 'px' }}")
```

第二种方法：

```
([age])
```

对于某些直接饮用值的情况，在 css 语法支持的情况下，可以使用这种语法。注意，它不支持表达式的写法，双括号里面只能写变量名。

**引用宏**

在样式中，支持使用宏来决定 AOT 打包时是否要打包对应的 css 文件。使用方法如下：

```html
<style>
  @import "sfc:../shared/var.css";
</style>
```

前缀为 `sfc:` 的引用路径，在 JIT 模式下会当作普通的相对路径，被 import，在 AOT 模式下，会被打包进 bundle 中。

## 原理

SFCJS 的组件语法是类 svelte 的特定语法，没法直接在浏览器中运行，因此，我提供了一个运行时的编译器对组件语法进行编译，编译过程放在一个 webworker 中（可选的），编译完后得到一串 js 字符串，通过 blob 的形式将其插入到主文档中运行，基于 AMD 模块加载方式加载该组件，并基于库文件中提供的小型框架，实现响应式渲染效果。

响应式原理：虽然组件中撰写的是普通的变量，但经过编译后，实际上是一种叫 $$reactive 的对象，这个对象在内置框架的驱动下，具有类似 vue 一样的变化拦截能力，因此即使修改其深度的节点值，也可以触发更新。修改变量会被编译成调用内置的 update 方法，从而触发一个队列，当所有同步的 update 事件被推入队列之后，异步执行该队列，合并重复的 update，并最终基于队列中的任务，进行 DOM 的更新。

无 Virtual DOM 的节点更新原理：编译时，编译器识别模板中的节点是否依赖了某个变量，运行组件后生成的 DOM 节点上会记录当前节点的依赖情况，当 update 发生时，内部会去检查当前被修改后的变量是否有对应的 DOM 节点/子组件依赖它，如果依赖了，那么对应的这个节点就需要被更新。

响应式样式原理：基于 css 变量实现，组件的样式只在一个 shadow DOM 中生效，具有隔离性，如果样式中使用了变量，那么，在生成真实的 style 时，会产生两个 style 块，一个块是使用 css 变量的静态样式表块，而另一块只包含了所有 css 变量。当有被依赖的变量发生变化时，只包含 css 变量的 style 块被重建，重建后 css 变量变化，从而触发 style 样式表中对应规则的变化。

## API

**Auto Template**

SFCJS 支持在应用（而非组件）当前 html 中用 template 提前定义组件。例如：

```html
<head>
  <script src="https://unpkg.com/sfcjs"></script>
  <template sfc-src="./some.htm">
    <script>
      let a = 1;
    </script>
    <span>{{a}}</span>
  </template>
<head>

<x-sfc src="./some.htm"></x-sfc>
```

在上面代码中，通过含有 `sfc-src` 的 `template` 提前定义了一个组件，然后在下面用 `x-sfc` 使用该组件，这样可以不用通过异步请求来拉取组件代码。

同时，sfcjs 也支持直接在 auto template 中使用宏，由于宏中可以定义具体 tag，此时，你甚至可以不用传入具体的 sfc-src，让它自己内部生成。

```html
<head>
  <script src="https://unpkg.com/sfcjs"></script>
  <template sfc-src>
    <script type="application/ld+json">
      {
        "@context": "sfc:privilege",
        "@type": "t-some"
      }
    </script>
    <script>
      let a = 1;
    </script>
    <span>{{a}}</span>
  </template>
<head>

<t-some></t-some>
```

**Auto Link**

SFCJS 支持在当前 html 中使用 `link[rel=sfc]` 自动载入组件。例如：

```html
<head>
  <script src="https://unpkg.com/sfcjs"></script>
  <link rel="sfc" href="./some.htm" />
</head>
```

在上面代码中，link 引入了一个组件，这个组件会被提前载入，在载入完成之后，该组件就被加入到组件队列中等待被使用。

*注意：Auto template 和 auto link 区别在于一个需要网络请求，一个不需要，它们内容都是一样的，都是提前载入的。Auto link 如果载入过程消耗比较多时间，会导致界面不能及时展现组件内容，此时，如果你确定这个 link 不需要提前载入，你可以在 link 上加上 `delay` 属性来让这个 link 延时加载，从而避免阻塞渲染。*

**全局变量**

```html
<script src="https://unpkg.com/sfcjs"></script>
<script>
  const { SFCJS } = window;
</script>
```

**register**

在 window 上挂载的 `SFCJS` 全局变量提供了一个 `register` 方法，它支持手动注册一个组件：

```html
<script>
  SFCJS.register('./some.htm', `
    <script>
      let a = 1;
    </script>
    <span>{{a}}</span>
  `);
</script>
```

*实际上，在框架内部也是使用 `register` 实现 `template[sfc-src]` 的自动注册。*

**privilege**

这是一个非常高级的方法，它可以帮助你自定义自己的 custom element。

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

之后，你就可以在你的应用任何地方（不必须是在 sfc 内）使用 `<t-button>` 作为按钮组件。

```html
<t-button type="button" theme="error">提交</t-button>
```

参数：

- tag: 标签名，将作为 custom element 的标签名，因此，不可以被重复使用
- options: 可为 null
  - src: 组件文件的 url
  - props: props 对应的 mapping 关系，例如上面代码中，意思是 `type` 这个 prop 将从 `type` 这个属性上读取（正常情况下是从 data-type 上读取）
  - events: 事件名对应 mapping 关系，例如组件内抛出的事件为 some, 而你希望在外部使用 any 作为事件名接收，你可以传入 { any: 'some' }
  - onInit, onConnect, onMount, onDestroy, onChange 对应阶段的钩子函数，onChange 指 props 变化时
- source: 组件代码字符串，或者一个包含了组件源代码的 template 元素

其中 `src` 和 `source` 必须传一个：
当传入 `src` 且确实能读取到某个组件文件时，则不传 `source`；
当传入 `source` 将使用 `register` 对组件提前进行注册；
当传入 `source` 但没有传入 `src` 时，会使用一个假的 src (`/-/{tag}` 在需要被依赖时可以使用这个 url，之所以必须是一个 url，是因为 sfcjs 内部实现时要求通过 url 来读取组件源码，在编辑器中通过 url 来识别依赖关系等) 进行替代，并使用 register 对组件进行提前注册。

通过 `privilege`，你可以封装出非常有意思的高级别的库出来。

## 子组件

在一个组件中，我们可以引用其他组件作为子组件。引用时，通过 sfc: 协议 import：

```html
<script>
  import SomeComponent from 'sfc:./some-component.htm';
</script>
```

使用引入的子组件：

```html
<div>
  <some-component></some-component>
</div>
```

引入的组件名为驼峰形式，使用时标签名为多词连接形式。
为了维持 web components 规范，子组件必须以两个以上单词作为标签名。

引入子组件会提前加载子组件源码，保证第一次渲染时一次性渲染整个界面，但如果子组件依赖比较深时，第一次渲染等待时间较久，你可以通过 HTML 标准 preload 来并行预加载子组件以提升第一次渲染的速度。

**props**

组件接收外部组件传入的 props，即通过 `:` 开头的标签属性进行传递，通过 `sfc:props` 接收传入的 props。

```html
<script>
  import props from 'sfc:props';
</script>
<div id="{{props.id}}">{{props.content}}</div>
```

*此处注意，不可以将属性从 `props` 上解构出来后使用，而必须通过 `.` 操作符从 `props` 上读取属性。*

当前这个组件在被其他组件使用时，如下传递：

```html
<some-component :id="100" :content="'some string'" class="some"></some-component>
```

props 传递的是真实值，例如上面的 `100` 是数字 100 而非字符串 '100'，具体可以阅读上面的语法部分。

*组件只接收 props，无法读取组件的 attrs，例如上面的 `class` 这个属性，在组件内部读取不到，这个属性将被作为 `<some-component>` 这个 html 标签的属性生效。*

**事件**

和 vue 中的事件回调非常像，你可以在组件被使用时通过 `@` 开头的属性来绑定事件，在组件内部通过 `sfc:emit` 来抛出事件。

```js
import emit from 'sfc:emit';

function handleClick() {
  emit('triggered', 111)
}
```

这个组件在被使用时，如此接住 emit 的事件。

```html
<some-component @triggered="handleTrigger(event)"></some-component>
```

和 vue 很像，你必须使用 `event` 这个关键字来接住组件内部 emit 的第二个参数，例如上面代码中 `handleTrigger(event)` 中的 `event` 的值其实是 `111`。但和 vue 不同的是，你不可以只传一个 `handleTrigger` 就结束了，你必须在 @triggered 中传递完整的函数表达形式。

**其他内部接口**

除了 `props` 和 `emit`，你还可以使用下方接口：

- resolve(uri: string): 获得某个uri的绝对地址
- query(selector: string): 查询组件内的一个DOM元素
- computed(getter: () => any): 创建一个依赖计算变量
- update(): 手动更新视图
- watch(vars, callback: (next, prev) => void): 监听某个/某些变量的变化，当变化发生时执行callback，只能在顶层watch，且无法取消watch

## AOT

你可以通过 SFCJS 提供的编译工具实现运行前的编译。具体使用方法是使用 nodejs 运行如下脚本：

```js
const { bundle } = require('sfcjs/bunlder')
const code = bundle(file, options)
```

其中 `file` 为某个 sfc 组件的文件路径。`options` 包含如下配置信息：

- entryUrl: 提供该组件在上线后访问的 url 信息，默认为 `/${filename}`
- absRootPath: 规定用于读取项目文件的根路径，当我们引用一个组件时使用 `sfc:/some.htm` 这种形式时，工具需要知道从哪个位置去读取 some.htm
- outputDir: 提供输出的 bundle 文件路径信息，默认为 absRootPath，用于解决 import 相对路径问题
- importLib: 默认为 false，表示是否要在编译结果中引入 sfcjs，如果为 false，你需要手动用 script 标签引入 sfcjs 的库文件，如果为 true 表示你需要使用 webpack 等工具打包，如果为 `https://unpkg.com/sfcjs` 则表示从 CDN 引用
- ignores: (file|RegExp)[] 匹配到的文件路径对应的文件将不被编译进 bundle 文件中
- alias: { [key: string]: string } 在 AOT 时，引入组件的路径可能不好处理，此时，你可以通过 alias 把路径映射到一个可以准确读取本地文件的相对路径上
- macro: true|false, 是否启用宏

基于 `bundle` 函数，我们可以封装自己的 webpack loader，例如：

```js
module.exports = function(content) {
  const file = this.resourcePath
  const options = this.getOptions()
  const code = bundle(file, options)
  return code
}
```

*由于 sfcjs 是完全依赖 ESModule 的，所有的 ES 语法都需要浏览器支持，所以，你可以通过这种方法，把编译后的结果再交给 babel 去进行转译。（sfcjs 基于 Proxy 实现，不支持 IE 浏览器。）*

引入经过编译后的组件，将直接把该组件及其依赖打包进来，完成组件的注册。但是需要注意，如果要在界面中展示该组件，还是要使用 `x-sfc` 进行组件展示才行。

```html
<!-- 如果 importLib 为 false，你需要引入下面这一行 -->
<script src="https://unpkg.com/sfcjs"></script>

<!-- 引入经过编译后的代码包 -->
<script src="bundle.js" type="module"></script>

<!-- 展示组件界面，这里的 src 要与上面提供的 entryUrl 一致，建议使用下面这种绝对路径 -->
<x-sfc src="/index.htm"></x-sfc>
```

也就是说，编译工具把我们原有的 .htm 文件编译为 js 代码，在你的工程项目中可以和其他的代码打包到一起。但是最终要使用对应的组件时，需要使用 `x-sfc` 来进行组件的使用。

## 宏

你可为 sfc 提供更多描述信息，这些信息可让编译器按照对应的方式进行编译，从而可以让你的组件更加灵活。例如，你可以在 .htm 开头加入：

```html
<script type="application/ld+json">
{
  "@context": "sfc:privilege",
  "@type": "x-icon",
  "props": [
    "name"
  ]
}
</script>
```

宏信息中，必须包含 @context 和 @type 字段，@context 的值以 sfc: 开头，后面跟上要调用的方法，目前仅支持 privilege 方法。@type 为该方法的第一个参数，对于 privilege 而言，就是传入的 tag 名。其他字段则合并为一个对象，作为第二个参数传给该方法（该对象会被框架补充，一般该对象只提供基础的配置信息）。

*需要注意，单个组件的 @context 必须是唯一的，不能重复。*

上面的示例代码中，宏片段告诉编译器当前组件将利用 privilege 创建 x-icon 标签。

对于一个 sfc 文件而言，可能被多种情况使用，宏仅在两种情况下生效，一种是在 AOT 模式下开启了 `macro` 选项，另一种是通过 `<link rel="sfc" href="icon.htm" />` 引入基于 JIT 进行实时编译时生效。

```html
<link rel="sfc" href="icon.htm" macro="privilege:x-icon" />

<x-icon name="add"></x-icon>
```

JIT 模式下，我们通过 `<link rel="sfc" />` 来引入一个 sfc 组件文件，在该 link 标签上，我们需要传入 rel="sfc", href 另外 macro 是可选的，它用于覆盖组件文件内部自己定义的宏片段，格式为 `macro="{@context}:{@type};{@context}:{@type}"` 通过 `;` 传多个，每个使用 `:` 分开。如果不传的话，将默认使用组件文件自己内部定义的宏片段，而通过 macro 进行覆盖，则可以避免当前页面中多个 customElement 重名的问题。

另外需要注意，如果 macro 属性传入的 @context 在组件文件内没有定义，将不生效，只有组件已经定义的，才能正常工作。

基于上面这种模式，你可以轻松快速的创建自己的 web components，而不需要进行复杂的编译。

## 使用场景

### 场景一：在不同技术栈中使用相同的界面效果

有一个用于展示近期股票走势的界面需要被很多网站调用，但作为该界面的开发方，我们并不清楚对方是基于什么技术栈实现，我们不愿意提供基于 vue, react, angular 甚至 jquery 的不同版本，因此，我们使用 sfcjs 作为视图驱动引擎，将开发好的界面发布到我们的 CDN，客户只需要在他们的网站中插入 sfcjs 的框架文件，之后，可以多次调用我们公司开发的不同 x-sfc 组件。由于 sfcjs 是完全基于 web components 的，所以做到了样式上的隔离，同时对该组件的接入又极其方便，这大大提高了我们的交付效率和与客户沟通部署的成本。

### 场景二：服务端动态渲染

在一个电商网站中，我们希望在一个细节的地方做到会员与非会员有不同的界面呈现和交互效果，虽然使用vue中的v-if很容易做到，但是这使得我们在这个页面的代码非常臃肿，我们希望这个细节由后端来处理，根据不同的用户返回不同的组件内容。我们使用 sfcjs 作为视图驱动引擎，在这个细节处，我们的后端在以相同的 url 返回组件文件时，根据用户类型的不同，返回了不同的组件文件内容，这样就完美的解决了我们上述需求。

### 场景三：去工程化

在重构一个简单的抽奖系统时，我们原有的工程体系太复杂了，我们的团队人员不多，水平也参差不齐，我们希望通过技术降级，回到无需工程化工具的纯 web 开发模式，但对比了 jquery, vue2, angularjs 和 sfcjs 之后，发现 sfcjs 是最直接最快的，它让我们享受非常前卫的前端编程体验的同时，又以最古老的 web 无工程化开发模式让我们立即开始写界面，这完美达到了我们想要的效果。

### 场景四：UI 组件库

我们开发了一套组件库，后来发现我们要为公司内不同团队提供 vue 和 react 的两套版本，这让我们维护起来非常不方便，我们采用了 sfcjs 作为视图引擎，利用 sfcjs 的 AOT 能力，通过 privilege 把所有组件做成 web components 实现了组件的跨框架使用，解决了我们维护多套版本的烦恼。于此同时，我们还发现 sfcjs 所写的组件，更像是一个 UI 组件的描述，我们把单一组件原子化，在一个文件中描述这一个组件的设计逻辑，这使得我们把设计理念更加有效的推行起来。案例：[tdesign-sfc](https://github.com/tencent-cdc/tdesign-sfc)

## 使用建议

- 不推荐将 sfcjs 用于构建大型的应用，sfcjs 更适合小的界面渲染
- 使用 `import props from 'sfc:props'` 时，不要从 props 解构属性出来使用，而是通过 props.some 这种读取属性的方式使用，这样才能正确收集依赖
- 使用 CDN 部署组件时，要保证文件路径的正确，需要在测试阶段不断尝试可能的错误
- 库文件在头部加载，register, privilege 操作在头部完成，head 中可以包含 template 元素
- 框架使用了 Proxy, MutationObserver, fetch 这些需要较新版本的浏览器才能支持的接口


## vscode 插件

- [JSON Script Tag](https://marketplace.visualstudio.com/items?itemName=sissel.json-script-tag) 支持 `<script type="application/json">` 内 JSON 高亮
- [Vue Language Features (Volar)](https://marketplace.visualstudio.com/items?itemName=johnsoncodehk.volar) 支持 html 插值、函数高亮

## 开源协议

MIT
