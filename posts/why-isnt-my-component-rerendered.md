---
title: Why isn't my LWC component re-rendered?
publishDate: 2020-10-27
description:
---

This post started from [an issue](https://github.com/salesforce/lwc/issues/2249) reported by @itsmebasti on the LWC repository, wondering why a property annotated with `@track` is not picked up by LWC engine.

When it comes to mutation tracking we can distinguish 2 modes: record properties access and record properties mutation. When the LWC engine is rendering a component, the engine record all the properties that are used to render the current state of the UI. After the rendering is done, the LWC engine starts listen for mutation. If the engine detect that same property used in the previous rendering cycle is mutated, the engine flags the component as dirty and enqueue it for the next rendering cycle.

In short, **the LWC engine only re-renders a component is a property accessed in the pervious rendering cycle is updated**. This is an optimization that has been put in place to avoid a component from over-rendering.

## LWC reactivity

Nowadays, most the modern UI framework operate under the same assumption that the DOM state is function of the components' internal state. In other word: 

> _dom_state = render(component_state)_

Another assumption is that the `render` is side-effect free. Meaning that given some input - for the same `component_state` -, the method always returns the same output - the `render` produces the same DOM tree. What modern UI framework brings to the table is the ability to track track the internal component state and invoke the `render` method for you. This process of tracking state and re-rendering when needed what is commonly referred to as reactivity.

### Reactive class fields

In LWC all the fields declared in the class body are considered reactive. This means that LWC will watch any mutation applied made to those properties. Under the hood the framework adds a getter/setter pair for all the class fields properties. When a new value, the LWC engine compares the old value against the new value using `===` (it compares the object identity) to determine if the component need to render.

The following component code with a reactive field ...

```js
import { LightningElement } from 'lwc';

export default class App extends LightningElement {
    counter = 0;
}
```

... is interpreted like this by the LWC engine.

```js
import { LightningElement } from 'lwc';

export default class App extends LightningElement {
    // Internal property used to track the actual counter value.
    _counter = 0;

    get counter() {
        return this._counter;
    }
    set counter(newValue) {
        const originalValue = this._counter;

        // Update the internal counter value.
        this._counter = newValue;

        // Notify the framework if the new value is different than the previous one.
        if (newValue !== originalValue) {
            this._valueMutated();
        }
    }
}
```

While this work well with primitive values like booleans, numbers or strings; the identity check can't detect object or array mutations. Mutation an object in place doesn't changes its identity. To be picked up by the framework, a brand new object has to be reassigned to the class field.

```js
import { LightningElement } from 'lwc';

export default class App extends LightningElement {
    todos = [];

    handleClick() {
        // 👍 Mutation detected, setter is invoked with a brand new array because of the spread 
        // operator.
        this.todos = [...this.todos, 'Take a walk'];

        // 👍 Mutation detected, the setter is invoked with the new concatenated array returned by 
        // Array.prototype.concat.
        this.todos = this.todos.concat('Call a friend');

        // 👎 No mutation detected, because the setter is not invoked.
        this.todos.push('Get some coffee');

        // 👎 No mutation detected, Array.prototype.sort() sort the array in place and doesn't 
        // return a new array.
        this.todos = this.todos.sort();
    }
}
```

### Reactive class fields annotated with the `@track` decorator

To make developer life easier when working with objects, LWC exposes the `@track` decorator. This decorator can applied to any class fields. It indicates to the LWC engine to deeply track for mutation on the class fields value.

On top of adding a pair of getter/setter to track field reassignment, the field value is wrapped inside a JavaScript [Proxy](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Global_Objects/Proxy). Proxies are special objects in JavaScript with the capability intercept and redefine all the interaction against the wrapped object (also called target object). How the Proxy is setup for deep watch object deeply is a more advanced subject and would a great topic for a future blog post.

The following component code a tracked reactive field ...


```js
import { LightningElement, track } from 'lwc';

export default class App extends LightningElement {
    @track
    todos = [];
}
```

... is interpreted like this by the LWC engine.

```js
import { LightningElement } from 'lwc';

export default class App extends LightningElement {
    _todos = [];

    get todos() {
        // Return a proxified version of the current todo value.
        return this._getProxifiedObject(this._todos, {
            valueMutated: this._valueMutated,
        });
    }
    set todos(newValue) {
        const originalValue = this._todos;
        this._todos = newValue;

        if (newValue !== originalValue) {
            this._valueMutated();
        }
    }
}
```

The difference between reactive property with and without the `@track` decorator is that tracked properties returns a proxified version of the original value instead of returning the original value itself. The goal of this proxy is to intercept any mutation made to the original value and indicate to the framework that a value did change.


Let's update the previous todo example but this time with have `todos` annotated with the `@track` decorator.

```js
import { LightningElement, track } from 'lwc';

export default class App extends LightningElement {
    @track
    todos = [];

    handleClick() {
        // 👍 Mutation detected, setter is invoked with a brand new array because of the spread 
        // operator.
        this.todos = [...this.todos, 'Take a walk'];

        // 👍 Mutation detected, the setter is invoked with the new concatenated array returned by 
        // Array.prototype.concat.
        this.todos = this.todos.concat('Call a friend');

        // 👍 Mutation detected, the proxy intercepts the new item insertion in the array.
        this.todos.push('Get some coffee');

        // 👍 Mutation detected, Array.prototype.sort() sort the array in place and doesn't 
        // return a new array.
        this.todos = this.todos.sort();
    }
}
```

## Optimization

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

The `App` component has a single property called `counter`. In this case, the resulting DOM state for this component is a function of `counter`: `dom_state = render(counter)`. Since the `counter` object contains 2 properties (`id` and `value`), we can refine render function inputs to: . So if `counter` object or if `counter.id` or `counter.value` are updated the component should be re-rendered.

> _dom_state = function(counter, counter.id, counter.value)_

Now let say that the template associated with this component is the following:

```html
<template> Counter: {counter.value} </template>
```

With the combined knowledge of the component state and the template, you can refine the render function input to `dom_state = render(counter, counter.value)`. The `counter.id` property is never accessed by the template and doesn't influence the DOM output. Because of this is pointless to track changes made to the `counter.value` property.

> _dom_state = render(counter, counter.value)_