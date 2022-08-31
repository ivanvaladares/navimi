(() => {
    class xx {
        constructor() {
            console.warn("xx constructor");
        }

        test() {
            console.warn("xx test");
        }
    }

    return class {

        constructor() {
            this.counter = 0;
            this.wasRemoved = false;
            console.warn("click component constructor");

            this.list = [];

            const t = new Date().getTime();
            // this.timer = setInterval(() => {
            //     console.log(t);
            // }, 1000);

            this.xx = new xx();
        }

        addChild() {
            this.list.push("");
            //this.xx.test();
            this.update();
            this.update();
            this.update();
            this.update();
            this.update();
            this.update();
            this.update();
            this.update();
            this.update();
            this.update();
            this.update();
            this.update();
            this.update();
            this.update();
        }

        onMount() {
            console.log('ClickComponentClass.onMount()');
            this.querySelector("button").addEventListener("click", this.addChild.bind(this));
        }

        render(children) {
            console.log('ClickComponentClass.render()');
            this.counter++;

            return `<div>
                        <button>Click me!</button>
                        ${children}
                        <div id="click-component-children">
                        
                            ${this.list.map(l => `<child-component>${this.counter}</child-component>`).join(' - ')}
                        
                        </div>
                    </div>`;
        }

        onUnmount() {
            console.warn('ClickComponentClass.onUnmount()');
            this.wasRemoved = true;
            this.timer && clearInterval(this.timer);
        }

    }

})();