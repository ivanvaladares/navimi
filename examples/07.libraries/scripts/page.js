(() => {
    return class main {

        constructor(navimiFunctions, { myfx, linksFx }) {
            this.nfx = navimiFunctions;
            this.myfx = myfx;
            this.linksFx = linksFx;
            this.attachedSlider = false;
        }

        onEnter = async (context) => {
            this.myfx.renderWrapper(this.nfx);
            this.myfx.renderRoutePage(this.nfx, context);
            this.linksFx.setActiveMenu(context.url);
        };

    };
})();
