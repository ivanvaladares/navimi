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

## Usage

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
        jsUrl: "/home.js",
        templatesUrl: "/home.html",
    },
    "/about": {
        title: "About",
        jsUrl: "/about.js",
        templatesUrl: "/about.html"
    },
    .
    .
    .
});

```

home.html
```html
<t id="home-template">
    <div>
        <h1>It's working</h1>
    </div>
</t>
```

home.js
```js
(() => {
    return class main {

        constructor(navimiFunctions) {
            this.nfx = navimiFunctions;
        }

        init = () => {
            document.querySelector("body").innerHTML = 
                this.nfx.getTemplate("home-template");
        };
    
    };
})();
```
<br>

Check the examples folder for more details.