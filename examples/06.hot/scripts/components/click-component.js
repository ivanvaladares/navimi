(() => {

    return class {

        constructor() {
            this.counter = 0;
            this.wasRemoved = false;

            console.warn("click component constructor");

            this.list = [];
        }

        addChild() {
            this.list.push("");
            this.update();
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

        onMount(){
            this.querySelector("button").addEventListener("click", this.addChild.bind(this));
        }

        onUnmount() {
            console.warn('ClickComponentClass.onUnmount()');
            this.wasRemoved = true;
        }

    }

})();