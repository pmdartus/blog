---
title: Shadow DOM and event propagation
publishDate: 2021-03-28
description: "The definitive guide on event propagation in the shadow DOM."
---

<style>
  event-visualizer {
    margin-bottom: 2.5rem;
  }

  event-visualizer:not(:defined) {
    display: block;
    padding: 12px;
    font-family: arial, sans-serif;
    background: #fff;
    border: 1px solid #b1b1b1;
    border-radius: 3px;
  }

  event-visualizer:not(:defined):before {
    content: attr(label);
    font-weight: 600;
  }

  event-visualizer:not(:defined):after {
    display: block;
    content: 'Loading...';
    color: #9e9e9e;
  }
</style>

It took me quite some time to grasp how eventing works in the context of shadow DOM. I only came to appreciate this as I was implementing shadow DOM is jsdom. 

The web is full of articles and guide on about shadow DOM and eventing. However none of them give a complete picture on this subject. This article is my attempt to give full overview of how eventing works in the shadow DOM. By the end of this article you will understand: 

- how event propagation is influenced by the shadow DOM
- what is event retargeting
- how the composed path changes depending on the shadow tree mode 

## Shadow DOM 

Shadow DOM is the browser built-in encapsulation mechanism for building complex component tree. 
One of the main goal is to prevent component internals introspection from outside and avoid leaking internal details of the components for external consumers.
This directly affect how event propagates into the DOM.

## Refresher on eventing

The `Event` constructor accepts the following configuration `bubbles`, `cancelable` and `composed`. The `bubbles` and `composed` configuration directly influences how the event propagates in the DOM.

Objects inheriting from `EventTarget` have the capability to dispatch and listen for events. Since `Node` inherit from `EventTarget` it is possible to dispatch and listen for events on any `Text` node, or `Element`. `ShadowRoot` is also a `Node` so it is possible to dispatch and listen for events from any shadow root.

```js
const div = document.createElement('div');
const shadowRoot = div.attachShadow({ mode: 'open' });

shadowRoot.addEventListener('test', (evt) => {
  console.log('>> Shadow root listener invoked', evt);
});

const evt = new Event('test');
evt.dispatchEvent(evt);
```

By default, events don't bubbles up the through the DOM. It means that by default, a dispatched event only invoked the listener attached to the dispatched element. If you want to make an event bubble the `bubble` config has to be set to `true`.

## Event composed

By default events doesn't traverse the shadow boundaries. In other words, event doesn't bubble from a shadow root to its host element by default. 

In the example, dispatching a bubbling event from the `div#d` propagates to `div#c` and `#shadow-root` and stops there. The event never reaches `div#a` since the element lives outside the shadow tree.

<event-visualizer label="Single shadow tree" event-bubbles>
  <template>
    <div id="a">
      <template shadowroot="open">
        <div id="c">
          <div id="d" target></div>
        </div>
        <div id="e"></div>
      </template>
      <div id="b"></div>
    </div>
  </template>
</event-visualizer>

For an event to traverse shadow boundaries, it has to be configured as a **[`composed`](https://developer.mozilla.org/en-US/docs/Web/API/Event/composed)**: `new Event('test', { bubbles: true, composed: true })`. Going back to the previous example, if `composed` is enabled, you can see the event escaping the shadow tree and reaching to `div#a`.

When the `composed` is set to `true`, the dispatch event not only traverses its own shadow boundary but also any other parent boundary. In the following example you can see that the bubbling and composed event dispatch from `div#e` bubbles to `div#c`, `div#a` and there respective shadow roots. 

<event-visualizer label="Nested shadow trees" event-bubbles event-composed>
  <template>
    <div id="a">
      <template shadowroot="open">
        <div id="c">
          <template shadowroot="open">
            <div id="e" target></div>
          </template>
          <div id="d"></div>
        </div>
      </template>
      <div id="b"></div>
    </div>
  </template>
</event-visualizer>

This might be counter intuitive (at least it was to me at the beginning) a composed always event propagates outside the shadow boundary regardless if the event if bubbling or not. Give a shot and set `bubbles` to false in the previous example to see how the event propagates.

As you can see, when the dispatched event is composed only, the event propagates from one host element to another, `div#c` and `div#a`, without propagating through the intermediary nodes. When thinking about DOM events propagation, **`bubbles` indicates if the event propagates throw the parent hierarchy** while **`composed` indicates if the event should propagate throw the shadow DOM hierarchy**. A bubbling and composed event propagate throw all the node from the dispatched one up to the document root.

You should be cautious with using both `bubbles` and `composed` at the same time when building complex applications. 

## Event retargetting

The [`Event.prototype.target`](https://developer.mozilla.org/en-US/docs/Web/API/Event/target) property references the object which the event was dispatched from. When an event is dispatched from a DOM node, it target is set to the node from which the event originates.

To preserve element encapsulation 

## Slotting


## ComposedPath


<script type="module" src="https://cdn.skypack.dev/pin/@pmdartus/event-visualizer@v2.0.0-GDc7Ml0NKA1QpykUvAdD/mode=imports,min/optimized/@pmdartus/event-visualizer.js"></script>