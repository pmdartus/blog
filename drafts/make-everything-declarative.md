---
title: Make everything declarative
date: 2021-12-20
description: "TODO"
---

Something that sticked with me early on when a started working at Salesforce.
Was working on an internal tool to measure web app performance time.
Asked developers and QAs to author scenarios.

> We should make a declarative interface. This will help the tool adoption.

Instead of expressing those scenarios as a list of statements, condition and loops in JavaScript, we decided to use define those steps as a JSON and interpret the JSON. 

But at that time I wasn't happy about this decision.  I was really into functional programming, and wanted to expose any API for composing. This would be more expressive and give developers a lot more flexibility in the way they compose their test cases.

Fast forward to today, this tool is still in use 18K performance runs per day. We have seen a strong adoption of Soleil early on, where not only dev, but also quality engineers and product manager authoring and maintaining those test cases. Consumers didn't needed to be JavaScript experts to get some performance numbers.

In retrospect this was a good decision and I thank Steven for pushing me toward this API design.

Web is a vibrant community.
Almost anybody with a computer and some time can learn how to build a basic web page. 
There are also extremely complex web applications.

How this platform enables anybody to create simple pages but also enable developers to create highly sophisticated applications? On of the main reason, is the web offers both a declarative and programmatic interface. 


The declarative API: HTML + CSS. Allow to render some content and also define the look and feel. We also often forget that HTML also enable navigation, form validation and many other accessibility features like focus control or assistive text. CSS allow to define complex layout, implement complex animation, responding to real restate present on the screen, and even render 3d content. 

All of this can be done with having to define a function, a condition or a loop. (to be nuanced)

The programmatic API: JS + WASM. For developers who are looking to build more interactive pages and complex applications, JavaScript comes to the rescue. 
The same page can also be written in JavaScript, via the DOM APIs. On top of this, the web platform APIs gives even more control. Access to the network, file system, Bluetooth and even geolocation. 


