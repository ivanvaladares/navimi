(() => {

    return class ChildComponentClass {        
        
        constructor() {

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
            return `<span>OK! ${children}</span>`
        }

    };

})();