---
title: About me
description: Pierre-Marie Dartus is a software engineer working at Salesforce. He primarily works on web platform tooling and performance optimizations.
layout: layouts/base.njk
eleventyNavigation:
  key: About
  order: 0
---

# About me

{% image "../static/img/profile-picture-small.jpg", "Profile picture", "100vw", "eager" %}

Hi! I am Pierre-Marie Dartus, software engineer based out of Paris, France.

Currently working at Salesforce on the UI platform, I create tools and frameworks for developers to build the next generation of web applications on the Salesforce platform.

I primarily work on the web platform and JavaScript runtimes APIs, developer tooling, and performance optimizations. Web standard and open source enthusiast, I am a W3C representative and maintainer of [jsdom](https://github.com/jsdom/jsdom).

[GitHub](https://github.com/pmdartus) / [Twitter](https://twitter.com/pmdartus) / [LinkedIn](https://www.linkedin.com/in/pmdartus)

## Projects

-   [Lightning Web Components](https://github.com/salesforce/lwc): A lightweight Web component based UI framework
-   [jsdom](https://github.com/jsdom/jsdom): A JavaScript implementation of various web standards, for use with Node.js
-   [observable-membrane](https://github.com/salesforce/observable-membrane): A Javascript membrane implementation using Proxies to observe mutation on an object graph
-   [rcast](https://github.com/pmdartus/rcast): PWA podcast player written with LWC
-   [snapline](https://github.com/pmdartus/snapline): Convert screenshots stored in devtool performance trace into GIFs
-   [speedline](https://github.com/paulirish/speedline): Calculate the speed index from devtools performance trace

## Talks

{% for talk in talks %}
- {{talk.year}} - **{{ talk.title }}**
  {%- if talk.event %} _@ {{talk.event}}_{% endif %}
  [{%- for link in talk.links -%}
    [{{link[0]}}]({{link[1]}}){%- if forloop.last == false %} / {% endif -%}
  {%- endfor -%}]
{%- endfor -%}