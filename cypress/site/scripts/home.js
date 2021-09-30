(() => {
    return class main {

        constructor(navimiFunctions, {myfx} ) {
            this.nfx = navimiFunctions;
            this.myfx = myfx;
        }

        init = () => {
            this.myfx.renderTemplate(this.nfx, "home-template");
        };
    
    };
})();
