---
title: Step Up Your LWC skills - Part 2
date: 2020-10-27
description: "LWC tips: JavaScript best practices, testing & code quality."
---

> 📝 This post has originally been published to the Salesforce developer blog: [https://developer.salesforce.com/blogs/2020/10/step-up-your-lwc-skills-part-2.html](https://developer.salesforce.com/blogs/2020/10/step-up-your-lwc-skills-part-2.html)

Over the past two years, I've had the opportunity to review hundreds of Lightning Web Components developed by internal Salesforce developers and by customers and partners building on the Salesforce platform. This post is the second post of a two parts series covering some of the recurring observations and feedback.

In the [previous post](/blog/step-up-your-lwc-skills-part-1) we discussed tips that are specific to LWC. This post explores how to make your JavaScript code more resilient and and how to improve the code quality of your project.

## JavaScript best practices

### Make invalid state hard to represent

When building an LWC component, you should structure your component so that it’s impossible for the component to be invalid. Think of your LWC component as a [state machine](https://en.wikipedia.org/wiki/Finite-state_machine), where each interaction with this component makes the component transition from one state to another. A component enters an invalid state when its public and private properties (the component state) have values that shouldn’t be possible.

It would deserve a full blog post to cover the subtle art of state structuring, but for brevity’s sake, I will focus on the simple yet common issue of state duplication.

Let’s look at a simple example to illustrate this issue. This component tracks a counter value and shows some text if the value is strictly greater than 0.

```html
<template>
    <p>
        Value: {value}
        <template if:true="{isPositive}">(I am positive)</template>
    </p>
    <button onclick="{handleInc}">Inc.</button>
    <button onclick="{handleDec}">Dec.</button>
</template>
```

```js
import { LightningElement } from 'lwc';

export default class Test extends LightningElement {
    value = 0;
    isPositive = false;

    handleInc() {
        this.value++;
        this.isPositive = this.value > 0;
    }
    handleDec() {
        this.value--;
        this.isPositive = this.value > 0;
    }
}
```

This approach suffers from the fact that this component needs to deal with two fields, `value` and `isPositive`, when only a single property is actually needed.

-   Both the `handleInc` and `handleDec` methods need to make sure that `value` and `isPositive` stay in sync.
-   If the initial value of the `value` property is changed from `0` to `1`, the `isPositive` initial value must also be set to `true`.
-   If we added a reset functionality, both `value` and `isPositive` would need to be reset.

Let's refactor the example to use a single property. With this approach, the `isPositive` property is derived from `value` using a getter. By keeping a single tracked property, the component can’t be in an invalid state.

```js
import { LightningElement } from 'lwc';

export default class Test extends LightningElement {
    value = 0;

    get isPositive() {
        return this.value > 0;
    }

    handleInc() {
        this.value++;
    }
    handleDec() {
        this.value--;
    }
}
```

### Do you really need those libraries?

With more than 1 million packages published on NPM, there is a high chance that someone has already released a library for what you’re trying to build. While reusing existing libraries greatly increases your productivity, keep in mind that this productivity boost comes with some trade-offs.

-   **Performance degradation:** Depending on the size, each library you load may impact end-user perceived performance.
-   **Locker integration issues:** The Locker Service enforces strict constraints for code that runs in Lightning. When using some third-party code, you lose control of which APIs are used, and those APIs may not be compatible with Locker. Debugging Locker related integration issue can be quite challenging. When you are lucky, an error is thrown at runtime. In some cases, the third-party library might fail silently. The easiest way to know if an issue is due to Locker is to load your library and reproduce the same code in the [Locker Console](https://developer.salesforce.com/docs/component-library/tools/locker-service-console), where you can turn Locker on and off.

Before integrating any third-party code into your application, ask yourself if you really need this code. Over the years, JavaScript and DOM APIs have added new features that make existing libraries less necessary. Here are some of the most popular JavaScript libraries that you might not need in [evergreen](https://www.techopedia.com/definition/31094/evergreen-browser) browsers.

-   **jQuery** (29 KB minified + gzip): https://github.com/nefe/You-Dont-Need-jQuery
-   **Lodash** (26 KB minified + gzip): https://github.com/you-dont-need/You-Dont-Need-Lodash-Underscore
-   **MomentJs** (core: 16 KB minified + gzip / core + locales: 61 KB minified + gzip): https://github.com/you-dont-need/You-Dont-Need-Momentjs

If you decide that you really need some third-party code, there are a couple of ways to load it in your LWC component.

The first approach is to load the third-party code via **an LWC module**. For a long time, libraries were distributed in [UMD (Universal Module Definition)](https://github.com/umdjs/umd) format. However, this format suffers from many issues. With ECMAScript 6, we saw the introduction of the [ESM (ES Module)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules) format, which became the blessed way to distribute modular JavaScript code. Today an increasing amount of libraries provide an ESM distribution, and we’ll see this number increase over time as Node.js recently landed native support for this format.

Unlike Aura, which is centered around the concept of Aura components, LWC is centered around the concept of modules. All the JavaScript files in LWC are ES modules, and some of those files might export an LWC component. So if the library that you’re interested in provides an ESM artifact, you can just copy-paste that file into your project to load it.

Like any other LWC modules, the LWC compiler takes care of minifying the code when your application is running in production mode. Also, LWC applications might be loaded in ancient browsers (for example, IE11) that don't support ES6+ features. To overcome this, the LWC compiler transforms those features into JavaScript code that these old browsers are able to understand. If you load third-party libraries via an LWC module, you'll benefit from this transformation.

An alternative approach is to load the third-party code via **a static resource** and **[`lightning/platformResourceLoader`](https://developer.salesforce.com/docs/component-library/documentation/en/lwc/lwc.js_third_party_library)**. For libraries that don’t offer an ESM distribution or for libraries that include JavaScript and CSS resources, static resources are the way to go. The `lightning/platformResourceLoader` module exposes two methods --`loadScript` and `loadStyle`-- that are equivalent to creating a script tag or a style tag and inserting it into the component’s shadow root.

Keep in mind that static resources are not processed by the LWC compiler. You have to make sure that all the loaded resources are already minified and that the JavaScript syntaxes are supported by the browsers your customers use.

I’ll leave you with two pieces of advice that can drive your decision when it comes to evaluating third-party code.

-   Always check the size of the third-party code. If the library size is greater than 30KB minified + gzip, ask yourself twice if this code is really needed.
-   Always favor self-contained libraries over libraries with external dependencies. I would always prefer a standalone carousel library (for example, [glidejs](https://glidejs.com/docs/)) over a jQuery plugin carousel (for example, [slick](https://kenwheeler.github.io/slick/)). Using a self-contained library will save you from some debugging interoperability nightmares.

## Code Structure

### Organize your class fields & methods

It’s a good practice to group the class fields and methods in a consistent order, because it helps navigate the code. Here’s the way I structure my components.

```js
export class Test extends LightningElement {
    // Exposed properties using the @api decorator
    @api publicFoo;
    @api publicBar;

    // Reactive field using @track decorator
    @track reactiveFoo;
    @track reactiveBar;

    // Wired field
    @wire(getObjectInfo, { objectApiName: ACCOUNT_OBJECT })
    foo;

    // LWC lifecycle hooks
    connectedCallback() {}
    renderedCallback() {}

    // Exposed methods using @api decorator
    @api myMethod() {}
    @api
    get myAccessor() {}
    set myAccessor(val) {}

    // The rest
}
```

### Organize your imports

Import statements are the standard way to reference Salesforce platform features from your LWC components: [Apex methods](https://developer.salesforce.com/docs/component-library/documentation/en/lwc/lwc.apex), [labels](https://developer.salesforce.com/docs/component-library/documentation/en/lwc/create_labels), [static resources](https://developer.salesforce.com/docs/component-library/documentation/en/lwc/lwc.create_resources), [permissions](https://developer.salesforce.com/docs/component-library/documentation/en/lwc/lwc.create_get_permissions), and so on. Complex components have the tendency to import a lot of external modules. As the number of `import` statements increases, it becomes necessary to start structuring them.

Each developer has their own preferences for styling. This is the way I group my imports.

```js
// Bare module imports
import { LightningElement } from 'lwc';

// "lightning/*" imports
import { createRecord } from 'lightning/uiRecordApi';
import { createMessageContext } from 'lightning/messageService';

// "@salesforce/*" imports grouped by type.
// If you have a lot of them, don’t hesitate to separate them by a line return.
import labelA from '@salesforce/label/c.labelA';
import labelB from '@salesforce/label/c.labelB';

import apexA from '@salesforce/apex/ApexController.apexA';
import apexB from '@salesforce/apex/ApexController.apexB';
import apexC from '@salesforce/apex/ApexController.apexC';

// "c/*" imports
import shared from 'c/shared';
import { utilA, utilB } from 'c/utils';

// The rest of the relative imports
import { relativeA } from './relativeA';
import { relativeB } from './relativeB';
```

When there are too many imports in a single file you can externalize them. This is a common approach when a component imports a LOT of labels. Instead of importing all the labels in the component file, import the labels in a separate file (`label.js`) and export them as a single object. To make all the labels accessible to the template, the component file (`cmp.js`) imports the object containing all the labels and assigns it to a property.

```js
// labels.js
import A from '@salesforce/label/c.labelA';
import B from '@salesforce/label/c.labelB';
import C from '@salesforce/label/c.labelC';
import D from '@salesforce/label/c.labelD';

export default {
    A,
    B,
    C,
    D,
};
```

```js
// cmp.js
import { LightningElement } from 'LightningElement';
import labels from './labels';

export default class Cmp extends LightningElement {
    labels = labels;
}
```

You can note that this trick not only works with label imports, but also with all the other salesforce imports in the LWC.

## Testing

### Don’t create public properties for testing purposes

LWC intentionally doesn’t provide an equivalent to the [Apex @TestVisible](https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/apex_classes_annotation_testvisible.htm) annotation. If you’re used to this escape hatch, it might be challenging to write LWC unit tests. It might be tempting to use `@api` to expose properties and methods just so that you can test them. This approach has the undesirable side effect of exposing those properties at runtime, which makes the component more fragile.

Instead, LWC encourages writing [blackbox unit tests](https://en.wikipedia.org/wiki/Black-box_testing). Picture your component responding to a set of inputs and producing different outputs. With blackbox unit testing, a test should check if a set of inputs produces the expected output.

**Inputs** are what triggers a component to change:

-   public properties
-   events received from a child
-   global events
-   external side effects

**Outputs** reflect how the component reacts to inputs:

-   DOM state
-   events
-   external side effects

To illustrate, let’s use a simple example. Consider a component that displays a `<lightning-spinner>` while the data is being loaded. A private field named `isLoading` switches from `false` to `true` to display the spinner.

```html
<template>
    <template if:true="{isLoading}">
        <lightning-spinner></lightning-spinner>
    </template>
    <template if:false="{isLoading}"> {data} </template>
</template>
```

```js
import { LightningElement } from 'lwc';
import { loadRecord } from 'c/recordUtils';

export default class Loader extends LightningElement {
    isLoading = false;
    data = null;

    connectedCallback() {
        (this.isLoading = true), (this.data = null);

        loadRecord().then((res) => {
            this.isLoading = false;
            this.data = res;
        });
    }
}
```

How would you test the loading state of the component?

The most straightforward approach is to check if the `isLoading` field is `true` when the data is loading and then set it to `false` after the reception of the data. Such an approach would require making the `isLoading` field public, which is the opposite of what we want.

We don’t want a component consumer to set the `isLoading` field. The `isLoading` field is only used inside the component to transition the spinner from visible to hidden. In this case, what we need to test is not that the `isLoading` flag (internal state) is set, but rather than the spinner is actually rendered (output: DOM state).

This test, instead of checking the `isLoading` field value, queries the shadow root to see if the `<lightning-spinner>` is actually rendered. We’re testing what the software does, not how it does it. (For brevity, the code required to mock the `loadRecord` method isn’t present.)

```js
import { createElement } from 'lwc';
import Loader from 'c/Loader';

it('renders a spinner when data is loading', () => {
    // ... mock loadRecord() method invocation ...

    const elm = createElement('c-loader', { is: Loader });
    document.body.appendChild(elm);

    const spinner = elm.shadowRoot.querySelector('lightning-spinner');
    expect(spinner).not.toBe(null);
});

it('unrender the spinner when data is loaded', () => {
    // ... mock loadRecord() method invocation ...

    const elm = createElement('c-loader', { is: Loader });
    document.body.appendChild(elm);

    return Promise.resolve()
        .then(() => {
            // ... resolve loadRecord promise with data ...
        })
        .then(() => {
            const spinner = elm.shadowRoot.querySelector('lightning-spinner');
            expect(spinner).toBe(null);
        });
});
```

## Code Quality

### Remove all method `console.*` methods before production

The [`console.*`](https://developer.mozilla.org/en-US/docs/Web/API/Console) APIs offer a quick way to debug JavaScript code: `console.log(message)`, `console.error(message)`, `console.warn(message)`, etc. Those methods are the JavaScript equivalent of [`System.debug(message)`](https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/apex_methods_system_system.htm) in Apex. As the application grows, it’s easy for the console to be flooded with log lines from dozens of components. Furthermore, these logs occur for all users; the code isn’t removed in non-`DEBUG` mode.

I recommend removing all the `console.*` usages in the code before you commit it to your source control management (like Git) or save it to your org. The [no-console](https://eslint.org/docs/rules/no-console) eslint rule, included in [eslint-config-lwc](https://github.com/salesforce/eslint-config-lwc), causes `console.*` references to appear as errors. The same rule can be enforced in your CI and developer flow (more in this [Embrace continuous integration (CI)](https://salesforce.quip.com/2IfuAD2bMipa#PVfACAndqQQ)).

Developer tools have come a long way since the `alert()` debugging days. To debug my components, I regularly use the following features instead of `console.*` APIs.

-   Conditional breakpoints: [Chrome](https://developers.google.com/web/tools/chrome-devtools/javascript/breakpoints) / [Firefox](https://developer.mozilla.org/en-US/docs/Tools/Debugger/How_to/Set_a_breakpoint) / [Safari](https://webkit.org/blog/5435/breakpoint-options/)
-   Pretty print file: [Chrome](https://developers.google.com/web/tools/chrome-devtools/javascript/reference#blackbox) / [Firefox](https://developer.mozilla.org/en-US/docs/Tools/Debugger/How_to/Pretty-print_a_minified_file)
-   Expression watch: [Chrome](https://developers.google.com/web/tools/chrome-devtools/javascript/reference#watch) / [Firefox](https://developer.mozilla.org/en-US/docs/Tools/Debugger/How_to/Examine,_modify,_and_watch_variables#Watch_an_expression)
-   Script black-boxing: [Chrome](https://developers.google.com/web/tools/chrome-devtools/javascript/reference#blackbox) / [Firefox](https://developer.mozilla.org/en-US/docs/Tools/Debugger/How_to/Black_box_a_source)
-   Watchpoint: [Firefox](https://developer.mozilla.org/en-US/docs/Tools/Debugger/How_to/Use_watchpoints)

### Adopt a linter

Linters are awesome static analysis tools that make development much easier. These tools analyze code without actually running it, and report errors for known issues. The linter is a huge time-saver and productivity-booster when used properly! Most of the obvious mistakes can be caught without pushing the code to your org, refreshing the browser, and triggering your component.

For LWC, we recommend using [ESLint](https://eslint.org/) along with the [eslint-config-lwc](https://github.com/salesforce/eslint-config-lwc). The linting is automatically set up and configured by the [Salesforce Extensions Pack for VS Code](https://marketplace.visualstudio.com/items?itemName=salesforce.salesforcedx-vscode#:~:text=Salesforce%20Extensions%20for%20Visual%20Studio,%2C%20Aura%20components%2C%20and%20Visualforce.) when you create an SFDX project. Other popular code editors also offer an integration with ESLint ([VSCode](https://github.com/microsoft/vscode-eslint), [Intellij](https://www.jetbrains.com/help/idea/eslint.html)).

Note that only the [`@salesforce/eslint-config-lwc/base`](https://github.com/salesforce/eslint-config-lwc#salesforceeslint-config-lwcbase-configuration) rules are enforced when saving a component to your Salesforce org. Locally, you can change the default linting configuration to be more or less strict depending your own preference.

### Enforce a consistent code style

Should you add a semicolon at the end of a statement in JavaScript? How many characters should there be on a single line? Should you use [tabs or spaces](https://www.youtube.com/watch?v=SsoOG6ZeyUI)? Each developer has their own opinion about how to format code.

It’s beneficial to enforce a certain set of code styling rules, especially as the number of developers involved in a project increases. A well-defined set of code styling rules offers advantages.

-   Eases the onboarding of new team member.
-   Eliminates pointless code formatting arguments during code review.
-   Simplifies reviewing someone else’s code. This is especially true when the person is external to the project.

Going a step further, the code formatting might be delegated to a tool such as [Prettier](https://prettier.io/). Using such tools removes the need to worry about manually formatting code before submitting a code change.

### Embrace continuous integration (CI)

Continuous integration automatically integrates the code changes of multiple contributors into a single software project. As the application grows in complexity and the number of contributors increases, pulling down each submitted code change locally to run the test and do manual verification becomes impossible. It’s important to automate these tasks as soon as you start a new project.

Things you can run as part of the CI:

-   Run your linter and make the build fail if the linter reports an error.
-   Run your code formatter and make the build fail if the code style guide isn’t respected.
-   Run unit and integration tests.
-   Deploy a canary version of the application for manual testing purposes.

To find out how to set up your own CI, follow the [Continuous Integration Using Salesforce DX trail](https://trailhead.salesforce.com/en/content/learn/modules/sfdx_travis_ci).

## Final words

Well, everything comes to an end. I hope this series gave you some insights into how to improve your LWC skills, regardless of whether you just started or if you’re an experienced developer. Let us know via Twitter if one of these tips worked well for you!

_Big shoutout to Alba Rivas and Jody Bleyle for the guidance and review of the blog post series._
