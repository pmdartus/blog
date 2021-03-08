---
title: Why isn't my LWC component re-rendered?
publishDate: 2020-10-27
description: 
---

This post started from [an issue](https://github.com/salesforce/lwc/issues/2249) reported by @itsmebasti on the LWC repository, wondering why a property annotated with `@track` is not picked up by LWC engine.

Properties annotated with the `@track` decorator are special. The values associated a tracked property are wrapped inside a JavaScript [Proxy](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Global_Objects/Proxy). Proxy intercept intercepts and redefines all the interaction against the original object. This base primitive is central to how the LWC engine understand how tracked properties are accessed and modified by user-land code.

Tradeoff to make between speed and accuracy. You don't want a framework to invoke too much `render` method, because it hurts the overall performance. Not under render either because the 

When it comes to mutation tracking we can distinguish 2 modes: record properties access and record properties mutation. When the LWC engine is rendering a component, the engine record all the properties that are used to render the current state of the UI. After the rendering is done, the LWC engine starts listen for mutation. If the engine detect that same property used in the previous rendering cycle is mutated, the engine flags the component as dirty and enqueue it for the next rendering cycle.

In short, **the LWC engine only re-renders a component is a property accessed in the pervious rendering cycle is updated**. This is an optimization that has been put in place to avoid a component from over-rendering.

## A short intro on reactivity

In the old days of UI frameworks, component authors where in charge of invoking the render manually. This created all sorts of maintainability and performance related issues. 

Nowadays, all the modern UI framework operate under the same assumption that the DOM state is function of the components' internal state. In other word: `dom_state = render(component_state)`. If a framework is capable to detect a state change it can transparently invoke the `render` method and reconciliate the component internal state with the DOM. In general, a UI framework is considered reactive if it is capable to track internal state change to reflect it to the DOM.

As you certainly know, rendering a component and updating the DOM is an expensive operation. You only want your UI framework to update the DOM only when it is really needed. 

Frameworks have put in place different heuristics to only render a component when necessary.

## How reactivity works in LWC

With this brief intro about reactivity of the way, time to look at how it work in LWC. In LWC there are 2 kind of reactive elements, standard class fields and class fields annotated with `@track` decorator.

### Reactive class fields

As the different source files goes through the LWC compiler, the compiler extracts analyses the class defined in JavaScript files and extract all the fields that are defined in the class body.

```js
import { LightningElement } from 'lwc';

export default class extends LightningElement {
    foo = 1; // Reactive class field
}
```