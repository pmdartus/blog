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
    display: flex;
    flex-direction: column;
    height: 500px;
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
    content: 'Loading...';
    color: #9e9e9e;
  }
</style>

Shadow DOM directly influences how event propagates through the DOM. It took me took me quite some time to fully appreciate this. This article is my attempt to give full overview of how eventing works in the shadow DOM. By the end of it you will understand: 

- how event propagation is influenced through shadow trees
- what is event retargeting
- how the composed path changes depending on the shadow root mode 


## Shadow DOM and encapsulation

Shadow DOM is a browser built-in encapsulation mechanism. This mechanism **offers a way for developers to authors components that are safe to distribute and to consume in third party pages**. The shadow DOM encapsulation work both ways. First it prevents component internals to be introspectable from outside the shadow DOM. But it also prevents shadow DOM internal to bleed into the third party page.

One of the feature Shadow DOM is mostly known for is its style scoping enforcement. Page-level styles don't get applied to elements rendered in a shadow tree. And styles injected in the shadow tree don't get applied at the page level.

All the spec adjustments and new features related to eventing that has been introduced along with shadow DOM revolves around this idea of how enables developers to authors components complying with this new encapsulation mechanism. Let's dive into it.


## `ShadowRoot`

The `ShadowRoot` is a constructor that has been introduced with shadow DOM. It extends for `EventTarget` and therefor it is capable to dispatch and listen for events like another other DOM nodes. 

```js
const div = document.createElement('div');
const shadowRoot = div.attachShadow({ mode: 'open' });

shadowRoot.addEventListener('test', (evt) => {
  console.log('>> Shadow root listener invoked', evt);
});

const evt = new Event('test');
shadowRoot.dispatchEvent(evt);
```

The shadow root is the root node for a shadow tree. It is possible to listen to any event originating from a shadow tree by adding the appropriate event listener directly on the shadow root.

Similarly to how events works in the light DOM, events only bubble in the shadow DOM if [`bubbles`](https://developer.mozilla.org/en-US/docs/Web/API/Event/bubbles) is set to `true`: `new Event('test', { bubbles: true })`. Events dispatch from within the shadow tree invokes the shadow root listeners if the event is marked as `bubbles`.


## Traverse shadow boundaries using `composed`

By default events doesn't propagate outside shadow trees. In other words, event doesn't propagate from a shadow root to its host element by default. This default behavior ensures that internal DOM events don't inadvertently leak into the document.

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

**For an event to traverse shadow DOM boundaries, it has to be configured as a [`composed`](https://developer.mozilla.org/en-US/docs/Web/API/Event/composed)**: `new Event('test', { bubbles: true, composed: true })`. Going back to the previous example, if `composed` is enabled, you can see the event escaping the shadow tree and reaching to `div#a`.

When the `composed` is set to `true`, the dispatch event not only traverses its own shadow boundary but also any other parent boundary. In the following example, the bubbling and composed event dispatch from `div#e` bubbles to `div#c`, `div#a` and there respective shadow roots. 

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

This might be counter intuitive but, a composed always event propagates outside the shadow boundary regardless if the event if bubbling or not. Give a shot and set `bubbles` to false in the previous example to see how the event propagates.

As you can see, when the dispatched event is composed only, the event propagates from one host element to another, `div#c` and `div#a`, without propagating through the intermediary nodes. When thinking about DOM events propagation, **`bubbles` indicates if the event propagates throw the parent hierarchy** while **`composed` indicates if the event should propagate throw the shadow DOM hierarchy**. A bubbling and composed event propagate throw all the node from the dispatched one up to the document root.

Now that you better understand how event propagates in the shadow DOM, it is important to call out that you should carefully think about how your events are configured especially if you are building some complex applications. Not all the events should composed and bubbling. Events are part of the public API exposed by a web component


### What about standard events?

<!---
Generated running the following script on: https://w3c.github.io/uievents

Array.from(document.querySelectorAll('.event-definition')).map(el => {
  const tableValue = field => Array.from(el.querySelectorAll('th')).find(th => th.textContent.trim() === field)?.nextSibling.textContent.trim();
  return { type: tableValue('Type'), bubbles: tableValue('Bubbles'), composed: tableValue('Composed') }
});

- https://w3c.github.io/touch-events/#touch-interface
- https://w3c.github.io/pointerevents/#firing-events-using-the-pointerevent-interface
- https://w3c.github.io/clipboard-apis/#clipboard-event-definitions
-->

Most of the standard [UI events](https://w3c.github.io/uievents) bubble and are composed with a few exceptions. There are a few exception like `mouseenter` and `mouseleave` that aren't bubbling and composed. Finally, the `slotchange` event stands out as the only bubbling and non-composed event.

<details>
    <summary>Complete event list</summary>

| Configuration                            | Type           |
| ---------------------------------------- | ------------- | 
| **Bubbling and composed events**         | `focusin`, `focusout`, `auxclick`, `click`, `dblclick`, `mousedown`, `mousemove`, `mouseout`, `mouseover`, `mouseup`, `wheel`, `input`, `keydown`, `keyup`, `keypress`, `touchstart`, `touchend`, `touchmove`, `pointerover`, `pointerdown`, `pointermove`, `pointerup`, `pointerout` |
| **Non-bubbling and non-composed events** | `mouseenter`, `mouseleave`, `pointerenter`, `pointerleave` |
| **Bubbling and non-composed events**     | `slotchange` |
</details>


## `Event.prototype.target`

The [`Event.prototype.target`](https://developer.mozilla.org/en-US/docs/Web/API/Event/target) property references the object which the event was dispatched from. When an event is dispatched from a DOM node, it `target` is set to the node from which the event originates.

To preserve shadow DOM encapsulation and avoid leaking component internals, the **`target` is updated to the host element as events cross shadow boundaries**. This process is called event retargeting. Let's take the same nested shadow tree example that we used before to illustrate this aspect:

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

When the composed event propagates from `div#c` shadow root to the host element, the event `target` is set to `div#c`. The same way once the event propagates through `div#a` shadow boundary, the event target is set to `div#a`.

One interesting side-effect of event retargeting is that once the event is done propagating the event `target` is always set to the outermost host element. In the case you are doing debouncing, the event `target` should be [cached](https://github.com/salesforce/lwc/issues/2265) otherwise the debounced loose track of the event target.


## `Event.prototype.composedPath`

The `Event.prototype.composedPath` method returns an array with all the node in order through which the event propagates. 

Something important to notice is that the composed path returns all the node throw which the event propagates through which is a superset of node on which event listeners is actually invoked. If you toggle the `bubbles` value you can see that the event invoke different listeners (as discussed in the previous section) however the composed path remains identical regardless.

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

Careful readers might notice that the composed path remains identical as the event propagate, while the target is retargeted. The composed path offers an escape hatch to get a handle on shadow DOM internal details. For example, as the event reaches `div#a`, its target is set to `div#a` thanks to retargeting. However it is always possible to get an handle on the node which originally dispatched the event by looking up the first entry in the composed path.



Another thing to be aware of with composed path is that it impact with the shadow root [`mode`](https://developer.mozilla.org/en-US/docs/Web/API/ShadowRoot/mode). Until now all the shadow tree presented in the article were `open`. The shadow root mode can either be `open` or `closed`. 

You can think of the `open` mode as a lightweight encapsulation. Even if the shadow tree internals are hidden it is always possible to access the shadow root associated to an element by looking up the [`shadowRoot`](https://developer.mozilla.org/en-US/docs/Web/API/Element/shadowRoot) property.

On the other hand the `closed` mode enforces strong encapsulation. The 

<event-visualizer label="Nested closed shadow trees" event-bubbles event-composed>
  <template>
    <div id="a">
      <template shadowroot="closed">
        <div id="c">
          <template shadowroot="closed">
            <div id="e" target></div>
          </template>
          <div id="d"></div>
        </div>
      </template>
      <div id="b"></div>
    </div>
  </template>
</event-visualizer>


## Slotting

> TODO

## Closing words

By now you should have a better idea of how eventing and shadow DOM work together. Here are couple of takeaways:
- Events never crosses shadow DOM boundaries except when `composed` is set to `true`.
- When `bubbles` is set to `true` the event propagates through the parent-child hierarchy. When `composed` is set to `true` events propagates through the shadow tree hierarchy.
- `Event.prototype.target` is set to the host element when traversing a shadow tree boundary.
- `Event.prototype.composedPath` returns all the node it propagates through except when the shadow root `mode` is set to `closed`.

If you are still uncertain how it works in a specific scenario not covered in this article you can always edit any of the event visualization in [Codepen](https://codepen.io/pmdartus/pen/ZELJRyX?editors=1000). 

<script type="module" src="https://cdn.skypack.dev/pin/@pmdartus/event-visualizer@v2.0.0-GDc7Ml0NKA1QpykUvAdD/mode=imports,min/optimized/@pmdartus/event-visualizer.js"></script>