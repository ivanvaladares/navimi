(() => {
    return class main {

        constructor(navimiFunctions, {myfx} ) {
            this.nfx = navimiFunctions;
            this.myfx = myfx;
        }

        init = async () => {

            await this.nfx.addLibrary("/css/css-test.css");

            this.myfx.renderTemplate(this.nfx, "css-template");
        };

    };
})();
