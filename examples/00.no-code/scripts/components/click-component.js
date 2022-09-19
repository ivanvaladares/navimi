(() => {

    return class {

        constructor(props, functions) {
            this.counter = 0;
            this.wasRemoved = false;

            this.functions = functions;

            console.warn("click component constructor");

            this.list = [];
        }

        addChild() {
            this.list.push("");

            this.functions.setState({"nome" :`Nome ${this.counter}`});

            this.update();
        }

        onMount() {
            console.warn('ClickComponentClass.onMount()');
            this.querySelector("button").addEventListener("click", this.addChild.bind(this));
        }

        render(children) {
            console.warn('ClickComponentClass.render()');
            this.counter++;

            return `<div>
                        <button>Click me!</button>
                        ${children}
                        <div id="click-component-children">
                        ${this.list.length == 0 ? "" : 
                          `<ul>
                            ${this.list.map(l => `<li><child-component>${this.counter}</child-component></li>`).join('')}
                          </ul>`
                    }
                        </div>
                    </div>`;
        }

        onUnmount() {
            console.warn('ClickComponentClass.onUnmount()');
            this.wasRemoved = true;
        }

    }

})();