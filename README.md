# Tune - The Spotify Recommendations Web App

**An Angular Ionic PWA**

**NOTE: To test out this app, your Spotify email must be added to the list of authorised users beforehand. Contact me if you would like to try.**

https://user-images.githubusercontent.com/17732915/177037209-5edcc0e6-394c-40bd-bae0-3d0cd8444bdc.mp4

## Key Features and Components

- 'Tinder-swiper' card-based music recommendation, determined by the users' favourite artists and tracks
- ['OAuth PKCE flow'](https://oauth.net/2/pkce/) used for Spotify account authorisation
- recommended track music previews played, via [AudioContext](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext)
- recommended track visualisations, utilising metadata for:
  - audio play progress
  - interactive cards (+ depth effects on touch/hover) [with Hammer.js](https://hammerjs.github.io/)
  - track and artist image, track title and artists
  - track feature category labels (i.e. 'high energy'/'low energy', 'hidden gem'/'popular')
  - seamless card background colour/track art blending, processed on a [Web Worker & OffscreenCanvas combo when supported (falling back to the main thread if necessary)](src/app/shared/services/average-colour.service.ts)
- reliance on reactive programming via [RxJS](https://rxjs.dev/) for asynchronous event handling
- ['IndexedDB'](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) and ['localStorage'](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage) are utilised for maintaining some basic data across sessions
- basic error handling on failed networking or authentication
- basic PWA capabilities (i.e. Service Worker)
- logging and [dynamic env configuration](src/assets/env.json)
- ['ii8n'](src/assets/ii8n/en.json) via [ngx-translate](https://github.com/ngx-translate/core)
- integrated with (deployed via) Firebase
- supports Chrome (+Edge), Firefox and Safari
- reactive design, suitable for desktop and mobile devices
- ['lint-staged'](https://github.com/okonet/lint-staged), ['ESLint'](https://eslint.org/) and ['Prettier'](https://prettier.io/) utilised for linting setup
- codebase complies with strict Typescript and Angular rules

## Performance Considerations

### UI Thread:

- if the browser supports Web Worker OffscreenCanvas, the calculations to fetch, convert and determine an album art's average colour are processed on a separate thread
- after a new card is loaded (and painted), only fast GPU compositor rendering events will occur on card interaction (avoiding Paint and Layout on interactions such as drag and hover), with CSS transforms and conservative ['will-change'](https://developer.mozilla.org/en-US/docs/Web/CSS/will-change) usage
- utilise [CSS 'contain'](https://developer.mozilla.org/en-US/docs/Web/CSS/contain) to help to improve rendering time

### Networking:

- multiple network requests are executed in parallel where possible (when they have no sequential dependencies) with ['Promise.All'](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all)
- where possible, all networking requests are batched to maintain low rates (i.e. when a track is 'liked' no call is fired until the current batch of liked ids gets flushed - either triggered by timeouts or exiting the page)
- assets are compressed where possible
- utilise [preloading/prefetching](https://developer.mozilla.org/en-US/docs/Web/HTML/Link_types/preload) for essential domains such as 'https://api.spotify.com'
- utilise [fetch priority hints](https://web.dev/priority-hints/)
- abort no-longer necessary fetch requests

### Angular:

- always use 'onPush' change detection
- run code outside of Angular's zone if it would trigger unnecessary change detections (i.e. for handling events such as card hovering)
- rely on pure pipes for template transformations
- modules are split and utilise lazy-loading to avoid excessive payloads
- ensure all observables are completed to prevent leaks

### Event handling:

- ensure all event listeners are removed to prevent leaks
- for handling all card events, listeners are added on a single wrapper element - relying on bubbled events - rather than listening to each card
