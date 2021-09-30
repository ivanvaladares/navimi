(() => {
    return class main {

        constructor(navimiFunctions, {myfx} ) {
            this.nfx = navimiFunctions;
            this.myfx = myfx;
        }

        init = async () => {

            await this.nfx.addLibrary([
                "/libs/dayjs.min.js",
                "/libs/mustache.min.js"
            ]);

            const date = dayjs('1981-05-26T12:34:56').format('DD-MM-YYYY HH:mm:ss');

            const template = this.myfx.getTemplate(this.nfx, "libs-template");

            document.querySelector("body").innerHTML = 
                Mustache.render(template, {date, name: "Navimi SPA"});
           
            this.myfx.hookNavigation(this.nfx);
        };

    };
})();
