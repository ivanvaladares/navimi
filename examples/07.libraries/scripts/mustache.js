(() => {
    return class main {

        constructor(navimiFunctions, { myfx, linksFx }) {
            this.nfx = navimiFunctions;
            this.myfx = myfx;
            this.linksFx = linksFx;
        }

        onEnter = async (context) => {
            this.myfx.renderWrapper(this.nfx);
            this.linksFx.setActiveMenu(context.url);

            await this.nfx.addLibrary([
                "https://unpkg.com/dayjs@1.8.21/dayjs.min.js",
                "https://unpkg.com/mustache@4.2.0/mustache.min.js"
            ]);

            const date = dayjs().format('YYYY-MM-DD HH:mm:ss Z[Z]');

            const template = this.nfx.getTemplate("mustache-template");
            
            document.querySelector("#div-content").innerHTML = 
                Mustache.render(template, {date, name: "Navimi SPA"});


            console.log(date);
            
        };

    };
})();
