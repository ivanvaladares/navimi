(() => {
    return class main {

        constructor(navimiFunctions, { myfx }) {
            this.nfx = navimiFunctions;
            this.myfx = myfx;
        }

        init = (context) => {
            this.myfx.renderWrapper(this.nfx);
            this.myfx.renderRoutePage(this.nfx, context);
        };
    
    };
})();
