# Navimi - Simplicity focused SPA library

> Navimi is a minimalist JavaScript library to create SPAs without a build process. <br>
> You will not be forced to take an imperative or reactive approach. Go the way you like it. <br>
> There is also no need to learn TypeScript, Babel, Webpack... You can use them if you want but you don't need.

## Features

- **Components**
  - Allows you to create reusable custom elements with encapsulated functionality.

- **Routing with path and queryString parsing**
  - Uses the widely adopted syntax for routes (/users/:id)

- **State management with watchers**
  - Watch changes to any level of the state using a simple dot notation.

- **Services injection**
  - Create your own services and have injected to your Routes and Components.

- **Routes middleware**
  - The middleware gives you a chance to intercept the request pipeline.
 
- **Scoped CSS**
  - Global and route scoped css with auto add and removal to avoid conflicts.

- **Atomic CSS-in-JS**
  - Write CSS using JavaScript in a declarative, conflict-free and reusable way.

- **Auto Lazy load scripts, templates, css and libraries**
  - Only load what and when you want.

- **Hot reload**
  - Makes it easier to create pages without having to refresh after every single modification. <br>
  <small>(This funcionality is only enabled in the unminified version)</small>

<br>

> All that in just ~7kb (compressed).

<br>

## Example of usage
https://navimi.web.app

<br>

## Browser compatibility
| Browser Version  | Date     |
|------------------|-------   |
| Chrome 55        | Oct 2016 |
| Firefox 52       | Mar 2017 |
| Edge 15          | Oct 2017 |
| Safari 11        | Sep 2017 |
| Opera 42         | Dec 2016 |

<br>

## Basic Usage "low-code"

index.html
```html
<!DOCTYPE html>
<html>

<body>
    loading...
</body>

<script src="/navimi-min.js" defer></script>
<script src="/routes.js" defer></script>
</html>
```

routes.js
```js
new Navimi({
    "/": {
        title: "Home",
        templatesUrl: "/home.html",
    },
    "/about": {
        title: "About",
        templatesUrl: "/about.html"
    }
});

```

home.html
```html
<div>
    <h1>It's working</h1>
    <a href="/about" navimi-link>About</a>        
</div>
```

about.html
```html
<div>
    <h1>Boom! Done!</h1>
    <a href="/" navimi-link>Home</a>
</div>
```

<br>


## Api

### Navimi constructor

- (routes: { [url: string]: Route }, options?: Options)

### Route
| Property     | Type                   | Description                                                     |
|--------------|------------------------|-----------------------------------------------------------------|
| title*       | string                 | The title that will be displayed on the browser                 |
| jsUrl        | string                 | The path to the route script                                    |
| cssUrl       | string                 | The path to the route css                                       |
| templatesUrl | string                 | The path to the templates file of this route                    |
| services     | string[]               | An array of services names for this route                       |
| components   | string[]               | An array of components names for this route                     |
| metadata     | { [key: string]: any } | Any literal you need to pass down to this route and middlewares |

\* required
<br />

### Options
| Property            | Type                     | Description                                                     |
|---------------------|--------------------------|-----------------------------------------------------------------|
| globalCssUrl        | string                   | The path to the global css                                      |
| globalTemplatesUrl  | string                   | The path to the global templates file                           |
| services            | { [key: string]: string }| A collection of all services {[service name]: script path}      |
| components          | { [key: string]: string }| A collection of all components {[component name]: script path}  |
| middlewares         | Middleware[]             | An array of functions to capture the request                    |
| hot                 | number \| boolean        | The port to the websocket at localhost                          |
| bustCache           | string                   | Adds a string at the end of files request to bust the cache     |
| onAfterRoute        | Function                 | A function invoked after the routing is done                    |
| onBeforeRoute       | Function                 | A function invoked before middlewares and routing               |
| onError             | Function                 | A function to capture erros from routes                         |

<br />

### Types

| Name                | Type                                                                                                                         |
|---------------------|------------------------------------------------------------------------------------------------------------------------------|
| Next                | (url?: string, params?: { [key: string]: any }) => Promise<void> \| void;                                                    |
| Context             | { url: string, routeItem: Route, params: { [key: string]: any } };                                                           |
| Middleware          | (context: Context, navigateTo: (url: string, params?: { [key: string]: any }) => void, next: Next) => Promise<void> \| void; |

<br />

### Navimi functions

Routes and Components will receive a collection of functions provided by Navimi. 

| Name                | Signature                                               | Description                                             |
|---------------------|---------------------------------------------------------|---------------------------------------------------------|
| addLibrary          | (jsOrCssUrl: string[]) => Promise<void>;                | Add one or more js and css to the page (global)         |
| fetchJS             | (jsUrl: string[]) => Promise<InstanceType<any>[]>;      | Fetch and return to your script one or many scripts     |
| fetchTemplate       | (templateUrl: string[]) => Promise<void[]>;             | Fetch and parse one or many templates                   |
| getState            | (key?: string) => any;                                  | Returns the state at any level using . notation         |
| getTemplate         | (templateId: string[]) => string[];                     | Returns one or many templates by templateId             |
| navigateTo          | (url: string, params?: { [key: string]: any }) => void; | Navigates to an url using the router                    |
| setNavimiLinks      | () => void;                                             | Hook click event to links with 'navimi-link' attributte |
| setTitle            | (title: string) => void;                                | Set the navigator title                                 |
| setState            | (state: { [key: string]: any }) => void;                | Set the state at any level using . notation             |
| unwatchState        | (key?: string \| string[]) => void;                     | Unwatch one or many state at any level using . notation | 
| watchState          | (key: string, callback: (state: any) => void) => void;  | Set a watcher to state at any level using . notation    |
| style               | (styles: { [key: string]: any }) => string;             | Returns class names for the provided style object       |

Check the examples folder for more details.

### Services
You can build scripts that will serve as your Services and they will behave like modules.
All services must be defined in `options.services`. 
Routes and Components will receive an object composed by services. 

- Routes: Services can be desconstruct from the second parameter on the constructor.

```js
  class {
    constructor(functions, {yourService1, yourService2 ... }) {
  ...
```

- Components: Services can be desconstruct from the third parameter on the constructor.

```js
  ['yourService1','yourService2', class ComponentClassName {
    constructor(props, functions, {yourService1, yourService2 ... }) {
  ...
```

For components, services must be explicitly declared as you see on the code above. 
Routes can have services declared on the Navimi constructor.


<br />

### Route life-cycle

```js
  class {
    constructor(functions, {yourServices ... }) {
        // (OPTIONAL)
        // variables initialization and binding events handlers
    }

    onEnter(context) {
        // invoked when the route is mounted.
        // context contains { url, Route, params }
        // time to render any DOM component you need
    };

    onBeforeLeave(context) {
        // (OPTIONAL)
        // context contains { url, Route, params }
        // return false if you wish to maintain the user on the current page
    }

    onLeave() {
        // (OPTIONAL)
        // the user is leaving this route
        // stop timers and event handlers if you need
    }

    destroy() {
        // (OPTIONAL)
        // this method will be called when the file changed and will Hot reload 
        // destroy timers and event handlers
    }
  };
```

<br />


### Component life-cycle

```js
  class {
    constructor(props, functions, {yourServices ... }) {
        // (OPTIONAL)
        // variables initialization and binding events handlers
    }

    onMount() {
        // (OPTIONAL)
        // invoked when the components is mounted.
    };

    render(children) {
        // children contains any nested html from your component's tag
        // return html code to render
    }

    shouldUpdate(prevProps, nextProps) {
        // (OPTIONAL)
        // this method will get called when any html property change on the component's tag
        // return false if you wish to prevent a rerender
    }

    onUnmount() {
        // (OPTIONAL)
        // destroy timers and event handlers
    }
  };
```

By default, when your component’s props change, your component will re-render. 
If your render() method depends on some other data, you can force the rerender by calling update().
Calling update() will not trigguer shouldUpdate.

<br />


### Page navigation

Navimi will automatically hook click event to links with 'navimi-link' attributte rendered during the 'onEnter()'. 

If you render any links after the 'onEnter()', you should call functions.setNavimiLinks() or
hook those links to functions.navigateTo yourself.

You can also call functions.navigateTo whenever you need to navigate.
