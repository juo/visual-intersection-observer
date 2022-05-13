# Visual Intersection Observer

## Problem

There is a great [Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API) that allows among others to observe if elements are present in the viewport or not. The missing part in the before-mentioned API is that under no circumstances one can use [Visual Viewport](https://developer.mozilla.org/en-US/docs/Web/API/VisualViewport) as the root for the `IntersectionObserver`. At the time of writing this there is an open discussion regarding the issue [here](https://github.com/w3c/IntersectionObserver/issues/95).

In other words `IntersectionObserver` works great as long as user does not zoom the website in or out, as soon as it happens the intersections reported by the `IntersectionObserver` are invalid.

## Solution

An `Visual Intersection Observer` that acts as a wrapping utility for the `Intersection Observer` that modifies the `rootMargin` appropriately to the `Visual Viewport`.

See the [demo](https://juo.github.io/visual-intersection-observer/) to see it in action.

## Known issues

- When document width is larger than the viewport intersection is not computed properly on mobile devices
