(() => {
    return class main {

        constructor(navimiFunctions, { myfx, linksFx }) {
            this.nfx = navimiFunctions;
            this.myfx = myfx;
            this.linksFx = linksFx;
            this.attachedSlider = false;
        }

        init = async (context) => {
            this.myfx.renderWrapper(this.nfx);
            this.myfx.renderRoutePage(this.nfx, context);
            this.linksFx.setActiveMenu(context.url);

            await this.nfx.addLibrary("https://unpkg.com/dayjs@1.8.21/dayjs.min.js");

            console.log(dayjs().format('YYYY-MM-DD HH:mm:ss Z[Z]'));

        };

    };
})();
