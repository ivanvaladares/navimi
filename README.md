# Navimi - Simplicity focused SPA library

> Navimi is a minimalist JavaScript library to create SPAs. The goal here is to provide a way to build a SPA without any tool, transpilation or bundling.

## Features

- **Routing with path and queryString parsing**
  - Uses the widely adopted syntax for routes (/users/:id)

- **State management with watchers**
  - Watch changes to any level of the state using a simple dot notation.

- **Services injection**
  - Create your own services and have them auto inject to your routes scripts making it easier to create and test them.

- **Routes middleware**
  - The middleware gives you a chance to intercept the request pipeline.
 
- **Scoped CSS**
  - Global and route scoped css with auto add and removal to avoid conflicts.

- **Lazy load scripts, templates, css and libraries**
  - Only load what and when you want.

- **Hot reload**
  - Makes it easier to create pages without having to refresh after every single modification.

<br>

> All that in just ~5kb (compressed). Works well with Alpine.js, Ejs, jQuery, Mithril.js, Mustache, Zepto.js ...


<br>

## Browser compatibility
| Browser Version  | Date     |
|------------------|-------   |
| Chrome 52        | Jul 2016 |
| Firefox 54       | Jun 2017 |
| Edge 14          | Aug 2016 |
| Safari 10.1      | Mar 2017 |
| Opera 39         | Aug 2016 |


<br>

## Basic Usage "no-code"

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

Check the examples folder for more details.


## Api

### Navimi constructor

- (routes: { [url: string]: Route }, options?: Options)

### - Route
| Property     | Type                   | Description                                                    |
|--------------|------------------------|-----------------------------------------------------------------|
| title*       | string                 | The title that will be displayed on the browser                 |
| jsUrl        | string                 | The path to the route script                                    |
| cssUrl       | string                 | The path to the route css                                       |
| templatesUrl | string                 | The path to the templates file of this route                    |
| dependsOn    | string[]               | An array of services names for this route                       |
| metadata     | { [key: string]: any } | Any literal you need to pass down to this route and middlewares |

\* required
<br />

### - Options
| Property            | Type                     | Description                                                    |
|---------------------|--------------------------|-----------------------------------------------------------------|
| globalCssUrl        | string                   | The path to the global css                                      |
| globalTemplatesUrl  | string                   | The path to the global templates file                           |
| services            | { [key: string]: string }| A collection of all services {[service name]: script path}      |
| middlewares         | Middleware[]             | An array of functions to capture the request                    |
| hot                 | number \| boolean        | The port to the websocket at localhost                          |
| onAfterRoute        | Function                 | A function invoked after the routing is done                    |
| onBeforeRoute       | Function                 | A function invoked before middlewares and routing               |
| onError             | Function                 | A function to capture erros from routes                         |

<br />

### Types

| Name                | Type                                                                                                                         |
|---------------------|------------------------------------------------------------------------------------------------------------------------------|
| Next                | () => Promise<void> \| void;                                                                                                 |
| Context             | { url: string, routeItem: Route, params: { [key: string]: any } };                                                           |
| Middleware          | (context: Context, navigateTo: (url: string, params?: { [key: string]: any }) => void, next: Next) => Promise<void> \| void; |

<br />
<br />

### Your Route Script constructor

The fisrt param of your constructor will receive a collection of functions provided by Navimi and the following param is an object composed by all your own services. You can descostruct this param using the names defined on `options.services`. \

List of function provided by Navimi to your Route Constructor.

| Name                | Signature                                                                          |
|---------------------|------------------------------------------------------------------------------------|
| addLibrary          | (jsOrCssUrl: string \| string[]) => Promise<void>;                                 |
| fetchJS             | (jsUrl: string \| string[]) => Promise<InstanceType<any> \| InstanceType<any>[]>;  |
| fetchTemplate       | (templateUrl: string \| string[]) => Promise<void \| void[]>;                      |
| getState            | (key?: string) => any;                                                             |
| getTemplate         | (templateId: string \| string[]) => string | string[];                             |
| navigateTo          | (url: string, params?: { [key: string]: any }) => void;                            |
| setTitle            | (title: string) => void;                                                           |
| setState            | (state: { [key: string]: any }) => void;                                           |
| unwatchState        | (key?: string \| string[]) => void;                                                |
| watchState          | (key: string, callback: (state: any) => void) => void;                             |

example:
```js
(() => {
    return class main {
      constructor(functions, { yourService1, yourService2, ... }) {
                      ^
    ...
```

Check the services example in the examples folder.