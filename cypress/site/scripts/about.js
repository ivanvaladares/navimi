(() => {
    return class main {

        constructor(navimiFunctions, {myfx} ) {
            this.nfx = navimiFunctions;
            this.myfx = myfx;
        }

        onEnter = () => {
            this.myfx.renderTemplate(this.nfx, "about-template");
        };
    
    };
})();
