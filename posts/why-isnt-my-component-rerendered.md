---
title: Why isn't my LWC component re-rendered?
publishDate: 2020-10-27
description: 
---

This post started from [an issue](https://github.com/salesforce/lwc/issues/2249) reported by @itsmebasti on the LWC repository, wondering why a property annotated with `@track` is not picked up by LWC engine.


Tradeoff to make between speed and accuracy. You don't want a framework to invoke too much `render` method, because it hurts the overall performance. Not under render either because the 

When it comes to mutation tracking we can distinguish 2 modes: record properties access and record properties mutation. When the LWC engine is rendering a component, the engine record all the properties that are used to render the current state of the UI. After the rendering is done, the LWC engine starts listen for mutation. If the engine detect that same property used in the previous rendering cycle is mutated, the engine flags the component as dirty and enqueue it for the next rendering cycle.

In short, **the LWC engine only re-renders a component is a property accessed in the pervious rendering cycle is updated**. This is an optimization that has been put in place to avoid a component from over-rendering.

## A short intro on reactivity

Nowadays, most the modern UI framework operate under the same assumption that the DOM state is function of the components' internal state. In other word: `dom_state = render(component_state)`. Another assumption is that the `render` is side-effect free. Meaning that given some input - for the same `component_state` -, the method always returns the same output - the `render` produces the same DOM tree. What modern UI framework brings to the table is the ability to track track the internal component state and  invoke the `render` method for you. This process of tracking state and re-rendering when needed what is commonly referred to as reactivity.

One of the huge caveat here is that, rendering a component and updating the DOM is an expensive operation. You only want your UI framework to update the DOM only when it is really needed.

One key optimization to avoid _over-rendering_ is for a UI framework to have a finer understanding of what the component state. Let's take the following example:


```js
import { LightningElement } from 'lwc';

export default class App extends LightningElement {
    counter = {
        id: 1234,
        value: 0,
    };
}
```

The `App` component has a single property called `counter`. In this case, the resulting DOM state for this component is a function of `counter`: `dom_state = render(counter)`. Since the `counter` object contains 2 properties (`id` and `value`), we can refine render function inputs to: `dom_state = function(counter, counter.id, counter.value)`. So if `counter` object or if `counter.id` or `counter.value` are updated the component should be re-rendered.

Now let say that the template associated with this component is the following:

```html
<template> 
    Counter: {counter.value} 
</template>
```

With the combined knowledge of the component state and the template, you can refine the render function input to `dom_state = render(counter, counter.value)`. The `counter.id` property is never accessed by the template and doesn't influence the DOM output. Because of this is pointless to track changes made to the `counter.value` property.

## LWC reactivity

Properties annotated with the `@track` decorator are special. The values associated a tracked property are wrapped inside a JavaScript [Proxy](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Global_Objects/Proxy) by the LWC engine. Proxy intercept intercepts and redefines all the interaction against the original object. The LWC engine is aware of all the properties access and properties mutation on track objects.

When the engine is doing with the properties access and properties mutation information depends on the component state. If a component is rendering, any property access will be stored for later consumption. If a component is not rendering any property mutation 