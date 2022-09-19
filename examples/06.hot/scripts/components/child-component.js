(() => {

    return ["linksFx", class ChildComponentClass {        
        
        constructor(props, functions, { linksFx }) {

            debugger

            const t = new Date().getTime();
            // this.timer = setInterval(() => {
            //     console.log("child", t);
            // }, 1000);

            
            console.warn("child constructor");
            
        }

        init() {
            this.wasRemoved = false;
        }

        onUnmount() {
            console.warn('ChildComponentClass.onUnmount()');
            this.wasRemoved = true;
            this.timer && clearInterval(this.timer);
        }

        render(children) {
            console.warn('ChildComponentClass.render()');
            return `<span>OK! ${children}</span>`
        }

    }];

})();