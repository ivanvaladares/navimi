(() => {

    return ["service2", class ChildComponentClass {        
        
        constructor(props, functions, { service2 }) {

            // debugger

            const t = new Date().getTime();
            // this.timer = setInterval(() => {
            //     console.log("child", t);
            // }, 1000);
            this.functions = functions;

            this.functions.watchState("nome", this.teste(this));
            
            console.warn("child constructor");
            
        }

        init() {
            this.wasRemoved = false;
        }

        teste(a) {
            debugger
            this.update();
        }

        onUnmount() {
            console.warn('ChildComponentClass.onUnmount()');
            this.wasRemoved = true;
            this.timer && clearInterval(this.timer);
        }

        render(children) {
            const nome = this.functions.getState("nome");

            console.warn('ChildComponentClass.render()');
            return `<span>OK! ${children} - ${nome}</span>`
        }

    }];

})();