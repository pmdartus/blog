---
title: Step Up Your LWC skills - Part 1
date: 2020-10-27
description: "LWC tips: getting started, LWC specific idioms, component communication"
---

Over the past two years, I've had the opportunity to review hundreds of Lightning Web Components developed by internal Salesforce developers and by customers and partners building on the Salesforce platform. This post is the first post of a two parts series covering some of my common observations and feedback.

## Before starting your LWC journey

### Get familiar with modern JavaScript

Lightning Web Components (LWC) is a framework for creating user interfaces using JavaScript and Web Components.

LWC relies heavily on language features that were introduced in ECMAScript 6 (aka ES6, aka ES2015). Aura offers support for ECMAScript 5 (aka ES5) features. With ES6, plenty of great features have been added to JavaScript. So if you’re coming from a Visualforce page or Lightning component (Aura) development background, I highly recommended that you brush-up on these modern JavaScript skills before starting your LWC journey:

-   Variable declarations using [`const`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/const) / [`let`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/let)
-   [Arrow functions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions)
-   [Promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)
-   [Classes](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes)
-   [Modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)
-   Array ([`Array.prototype.map`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map), [`Array.prototype.filter`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter)) and Object ([`Object.keys`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/keys), [`Object.values`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/values)) functional programming methods

When you’re familiar with those concepts, it’s easier to read and understand the LWC documentation and examples. If you’re interested in a refresher on ES5 features and if you want to learn about new ES6+ syntax, I recommend these resources:

-   [FreeCodeCamp - Introduction to JavaScript](https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/basic-javascript/)
-   [Trailhead trail - Learn to work with JavaScript](https://trailhead.salesforce.com/en/content/learn/trails/learn-to-work-with-javascript)
-   [Paying] [Pluralsight - JavaScript Path](https://www.pluralsight.com/paths/javascript)

### Start playing with native Web Components

Another core concept to LWC is Web Components. The term _Web Components_ refers to three sets of APIs: Custom Elements, Shadow DOM and `<template>` tag.

LWC is an abstraction layer on top of the low-level Web Component APIs that makes the developer experience enjoyable and productive. To learn LWC, it’s helpful to build some standard Web Components and get familiar with those low-level APIs. Many people overlook this step, but it’s helpful because after building a handful of Web Components, you’ll understand which concepts are standard and what LWC has added.

Here’s a list of resources to quickly get started on native Web Components:

-   [Google Web Fundamentals - Building components](https://developers.google.com/web/fundamentals/web-components)
-   [MDN - Web Components](https://developer.mozilla.org/en-US/docs/Web/Web_Components)
-   [Dev.to - Web Components: from zero to hero](https://dev.to/thepassle/web-components-from-zero-to-hero-4n4m#-setting-properties)

One of the greatest things about web components is that all the most modern browsers support them. To experiment with web components, you can just use your favorite online code editor (for example, [jsfiddle.net](http://jsfiddle.net/) or [glitch.com](http://glitch.com/)). You don’t need a complex setup or a convoluted build system.

## LWC tips

### Develop with debug mode enabled

If you take away one tip from this article, make it this: When working on LWC (or Aura Components) turn on debug mode. In your org, from Setup, enter Debug Mode in the Quick Find box, then select **Debug Mode**. For more information, see [Salesforce Help.](https://developer.salesforce.com/docs/component-library/documentation/lwc/lwc.debug_mode_enable)

When running in debug mode, the LWC framework includes warnings and errors to help developers find issues easily. However, these guardrails come at a cost: the framework code size in debug mode is 2x its size in production, and the framework performance in debug mode can be 4x slower than in production. That's why those warnings and errors don't appear in production mode. Do not enable debug mode in production instances!

For instance, in debug mode, the LWC engine validates the existence of all the public properties set via the template.

```html
<template>
    <c-child foo="bar"></c-child>
</template>
```

In the example above, LWC throws an error in debug mode if `<c-child>` doesn’t expose the `foo` public property. While in production mode, this runtime check is skipped.

### Only use direct DOM manipulation if it can’t be expressed via the template

The LWC framework syncs the internal component state with the DOM by abstracting away the DOM operations.
Manually modifying DOM element attributes (via the `setAttribute` method or `classList` or `style` properties) is something that should be left to the framework. In fact, direct DOM manipulation is actually fighting against how LWC operates. Finally, manual DOM manipulation is error prone and might lead to inconsistent UI.

To illustrate, let's create a component that renders a text input whose value drives the background color of a square.

```html
<!-- Anti-pattern -->
<template>
    <input type="text" onchange="{handleInputChange}" />
    <div style="width: 100px; height: 100px;"></div>
</template>
```

```js
import { LightningElement, track } from 'lwc';

export default class Test extends LightningElement {
    handleInputChange(evt) {
        const div = this.template.querySelector('div');
        div.style.backgroundColor = `#${evt.target.value}`;
    }
}
```

There are several issues with this approach:

-   LWC isn’t aware of the `background-color` CSS property set on the `<div>` element. If for any reason the engine removes the existing `<div>` (for instance if the component is wrapped in an `if` block), the `background-color` CSS property is lost.
-   Using `querySelector` and `querySelectorAll` may be very slow, especially if the component has many children.

A better approach is to use an event handler, a field, and a getter for the CSS property. Keep in mind that all fields are reactive if used in a template or in a getter that's used in a template, so when `bgColor` changes, the component rerenders.

```html
<!-- Pattern -->
<template>
    <input type="text" value="{bgColor}" onchange="{handleInputChange}" />
    <div style="{divStyle}"></div>
</template>
```

```js
import { LightningElement } from 'lwc';

export default class Test extends LightningElement {
    bgColor = '';

    handleInputChange(evt) {
        this.bgColor = evt.target.value;
    }

    get divStyle() {
        return `width: 100px; height: 100px; background-color: #${this.bgColor};`;
    }
}
```

### Object mutations and read-only objects

In some cases, data received by a component isn’t structured the way you want. It might be tempting to [mutate](https://medium.com/@fknussel/arrays-objects-and-mutations-6b23348b54aa) the received object to structure it to be consumed by your component. What does _mutating_ mean? It means updating a property on an object, adding/removing a property, changing the content of an array by adding or removing a value, and so on.

However, certain objects in LWC are read-only and can’t be mutated. The code throws an error when debug mode is enabled.

```js
import { LightningElement, api } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';

export default class extends LightningElement {
    contact;

    @wire(getRecord, {
        recordId: '123456',
        fields: ['Contact.Name', 'Contact.Title'],
    })
    handleRecord({ err, data }) {
        if (data) {
            // 🚫 Error: Invalid mutation!
            data.fields.Summary = {
                value: `${data.fields.Name.value} (${data.fields.Title.value})`,
            };

            this.contact = data;
        }
    }
}
```

There are two common cases where a component receives read-only objects:

-   A component receives data from its parent component via a public property (`@api`). To enforce the properties-down/events-up pattern (more on that later), LWC makes the passed object read-only to prevent children components from mutating objects that are owned by the parent component.
-   A component receives data from Lightning Data Service (LDS) via `@wire`. For performance reasons, if two Lightning Web Components request the same data from LDS, LDS shares the same objects between the two components. However, LDS prevents mutations of the emitted data by making the objects read-only. It does this because if one component mutates the object, all the components observe the mutation. This is called cache poisoning, and it creates challenges in understanding and debugging the application’s data flow and state, and can cause security issues.

Since you can’t mutate read-only objects, the right approach to change the structure of read-only object is to make a copy of the read-only object and mutate the copy. However there is a good and a bad way to copy read-only objects!

I’ve seen [numerous cases](https://salesforce.stackexchange.com/search?q=%5Blightning-web-components%5D+JSON.parse%28JSON.stringify%28) where components use `JSON.parse` and `JSON.stringify` to deep-copy objects to do some mutations.

```js
import { LightningElement, api } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';

export default class extends LightningElement {
    contact;

    @wire(getRecord, {
        recordId: '123456',
        fields: ['Contact.Name', 'Contact.Title'],
    })
    handleRecord({ err, data }) {
        if (data) {
            // 👎: This might be REALLY slow!
            const copiedData = JSON.parse(JSON.stringify(data));

            copiedData.fields.Summary = {
                value: `${data.fields.Name.value} (${data.fields.Title.value})`,
            };

            this.contact = copiedData;
        }
    }
}
```

Deep-copying an object is REALLY slow and (effectively) doubles the amount of memory used by the JavaScript VM. The scale of impact correlates to the size of the copied object. When the objects you manipulate are small, the impact is small. But when the values are large, as is the case for many values from [UI API](https://developer.salesforce.com/docs/atlas.en-us.uiapi.meta/uiapi/) which are >1 MB for most Salesforce organizations, deep-copying blocks the JavaScript main thread for more than 50ms.

A preferable approach is to make a shallow copy of the read-only object. The most straightforward way to make a shallow copy of an object in JavaScript is either via [object destructuring](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment) or via [Object.assign()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign).

```js
import { LightningElement, api } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';

export default class extends LightningElement {
    contact;

    @wire(getRecord, {
        recordId: '123456',
        fields: ['Contact.Name', 'Contact.Title'],
    })
    handleRecord({ err, data }) {
        if (data) {
            const { fields } = data;

            // 👍: Only copy what is needed.
            this.contact = {
                fields: {
                    ...fields,
                    Summary: {
                        value: `${fields.Name.value} (${fields.Title.value})`,
                    },
                },
            };
        }
    }
}
```

### Group related state in objects

All the fields in LWC are reactive, so assigning a value to a field might trigger the component re-render. As your components grow in complexity, the number of fields in the class will grow mechanically. Once a component is complex enough it’s fairly easy to lose track of what and how fields are related to each other.

To illustrate this, here’s an example of a component that has a `handleClick` handler which takes care of fetching data and setting it to a field. There is a bug in the following snippet. Try to spot it before going further.

```js
import { LightningElement, track } from 'lwc';
import { fetchData } from 'c/utils';

export default class Child extends LightningElement {
    isLoading = false;
    data;
    error;

    handleClick() {
        this.isLoading = true;

        fetchData()
            .then((data) => {
                this.isLoading = false;
                this.data = data;
            })
            .catch((err) => {
                this.isLoading = false;
                this.error = err;
            });
    }
}
```

The important line in the previous snippet is when the `isLoading` field is reset before invoking `fetch`. As you might have noticed, when the component enters in a loading state, the `data` and `error` fields are not reset. This is an issue when the `handleClick` method is invoked multiple times. If the first time the fetch fails and `error` is set, `error` will not be unset —regardless if the fetch passes.

If there is a logical relationship between different fields, it’s better to group them together into a single object rather than to manipulate each field individually. By grouping the fields into a single object, the developer intent is more clear and it’s harder to forget when to update dependent fields in a complex component.

```js
import { LightningElement, track } from 'lwc';
import { fetchData } from 'c/utils';

export default class Child extends LightningElement {
    dataState = {
        isLoading: false,
        data: undefined,
        error: undefined,
    };

    load() {
        this.dataState = {
            isLoading: true,
        };

        fetchData()
            .then((data) => {
                this.dataState = {
                    isLoading: false,
                    data,
                };
            })
            .catch((error) => {
                this.dataState = {
                    isLoading: false,
                    error,
                };
            });
    }
}
```

### Extract utility methods outside your LWC components

Generally speaking, LWC components should only deal with UI-related logic. Extracting the utilities (function, class, and shared state) outside the class body has the following advantages:

-   It creates a clear decoupling between UI-related logic and business logic
-   The utilities can be unit tested individually without creating and rendering a component
-   The utilities can be lifted into a [shared module](https://developer.salesforce.com/blogs/2019/05/lightning-web-components-service-components.html) to be reused by different components if needed.

### Enable console formatter in Chrome

LWC uses Proxies under the hood to observe object mutations for reactivity and to make data read-only.

As a side effect, objects are way less pleasant to debug in your favorite browser’s developer tools. For this purpose, we added a custom console formatter to pretty print those Proxied objects in the console. No need to `JSON.parse(JSON.stringify(obj))` to check the content of a proxied object! To learn how to enable the custom console formatter in Chrome, see [Debug your Lightning Web Components](https://developer.salesforce.com/blogs/2019/02/debug-your-lightning-web-components.html).

## Component communication

### Favor public properties over public methods

The `@api` decorator offers the capability to expose both properties and methods out of components. While it might be tempting to expose methods to interact with a component, you should always favor using properties.

Let’s take a simple example where we want to develop a carousel component that can be animated or not. In this first code sample, the `<c-carousel>` component exposes the `animate` public method for it to be animated. This pattern is quite cumbersome because it forces the component to wait for the component to be rendered and invoke the method in the `renderedCallback`.

```js
// Anti-pattern
// carousel.js
import { LightningElement, api } from 'lwc';

export default class Carousel extends LightningElement {
    @api animate() {
        /* ... */
    }
}
```

```html
<!-- parent.html -->
<template>
    <c-carousel></c-carousel>
</template>
```

```js
// parent.js
import { LightningElement } from 'lwc';

export default class Parent extends LightningElement {
    renderedCallback() {
        this.template.querySelector('c-carousel').animate();
    }
}
```

The same `<c-carousel>` component can be written in such a way to expose `animate` as a public property. As you can see, properties provide a far superior developer experience than methods for the component consumer. Properties can be set directly in the template, while a method requires the consumer to render the component first, retrieve it back from the DOM, and invoke the method.

```js
// Pattern
// carousel.js
import { LightningElement, api } from 'lwc';

export default class Carousel extends LigthningElement {
    @api animate;
}
```

```html
<!-- parent.html -->
<template>
    <c-carousel animate></c-carousel>
</template>
```

```js
// parent.js
import { LightningElement } from 'lwc';

export default class Parent extends LightningElement {}
```

### Avoid using Lightning Message Service or pubsub when not needed

One of the key differences between Aura and LWC is that there is no equivalent for [Aura Application events](https://developer.salesforce.com/docs/atlas.en-us.lightning.meta/lightning/events_application.htm) in LWC. An Aura application event is an event that is dispatched globally to all the components that are currently rendered regardless of their position in the DOM. Those events follow the same principle as the traditional publish-subscribe pattern.

At the launch of LWC, we added a [`pubsub`](https://github.com/trailheadapps/lwc-recipes/blob/aba8ef067a40e61b9e1ae39a0991cc518d684476/force-app/main/default/lwc/pubsub/pubsub.js) component to the LWC recipes app to bridge this gap until we had a supported platform feature. The main use case for this pattern is to communicate between components that don’t share the same root component. This is the case when two components that are part of the same flexipage (Lightning page) need to communicate.

In Summer ’20, Lightning Message Service (LMS) became Generally Available. Lightning Message Service is a supported platform component ([`lightning/messageService`](https://developer.salesforce.com/docs/component-library/bundle/lightning-message-service)) that uses a publish-subscribe pattern to communicate across the DOM between Visualforce pages, Aura components, and Lightning Web Components (including components in a utility bar).

For the rest of this section, the publish-subscribe pattern refers to both Lightning Message Service and `pubsub` component from the LWC recipes.

While using this pattern makes component communication painless, it comes with a drawback. The global nature of the publish-subscribe pattern creates an implicit dependency between components. This implicit dependency makes refactoring far more difficult.

In addition, if you use the `pubsub` component, all components registered to `pubsub` must manually unregister, otherwise the component won’t be garbage collected by the JavaScript VM and the allocated memory for those components won’t be released. (Lightning Message Service handles this via its `MessageContext` object. Depending on how you implement `MessageContext` you may or may not be required to manually unregister the message service.)

In short, use this pattern only as a last resort when attempting to communicate between components.

If you want component `<c-sender>` to communicate with component `<c-receiver>`, here’s the list of questions you should ask yourself:

-   Is `<c-sender>` a child component of `<c-receiver>` (bottom-up communication)? If yes, use DOM events to communicate from the child to the parent component.
-   Otherwise, is `<c-sender>` a parent component of `<c-receiver>` (top-down communication)? If yes, use properties to communicate from the parent to the child component.
-   Otherwise, do `<c-sender>` and `<c-receiver>` have `<c-parent>` as a common ancestor that you control? If yes, lift your state to the `<c-parent>` component, use DOM events to communicate from `<c-sender>` to `<c-parent>` and use props to communicate from `<c-parent>` to `<c-receiver>`.
-   If none of the above conditions apply, it means that `<c-sender>` and `<c-receiver>` are living in two distinct subtrees with no common ancestor that you control. This is a valid use case for LMS or pubsub.

### Be careful to avoid over-modularizing your components

As discussed previously, one of the main use cases for LMS and the publish-subscribe pattern is for components that are dropped on a Lightning page via Lightning App Builder. Because of its simplicity, developers tend to architect their components in a _modular_ fashion. Modularity is key to creating a scalable application by reusing components. Modularity also enables admins to compose pages the way they want via Lightning App Builder. The downside of this approach is that developers tend to _over-modularize_ their components, which leads to unnecessary usage of the publish-subscribe pattern.

For instance, imagine that you design a product listing view and decide to create a page in Lightning App Builder by adding a `<product-filter>` component and a `<product-list>` component. LMS may look like a primary choice for those components to communicate. However, this example is a bad use case for LMS. The real issue is that these components are too granular to be exposed to Lightning App Builder. Ask yourself these questions:

-   What happens when there is no `<product-filter>` associated with `<product-list>`? Can the `<product-list>` be rendered by itself?
-   What if the admin adds two `<product-list>` components to the page? What’s the expected behavior of the application?

Components exposed to Lightning App Builder should be able to stand on their own. In the previous example, the `<product-filter>` is tightly coupled to the `<product-list>`. This strong dependency between the components was hidden behind the usage of a publish-subscribe pattern.

An alternative way to design this view is to create a `<product-view>` component that’s responsible for rendering and coordinating the `<product-filter>` and `<product-list>` components. The `<product-filter>` component would then communicate via event to the `<product-view>` when the user changes the filter. The `<product-view>` passes the list of filtered product to the `<product-list>` via properties.

## Final words

That’s it for the LWC-specific tips. The [next article](/blog/step-up-your-lwc-skills-part2) in this series discusses how to make your JavaScript code more resilient and how to improve your code quality.
