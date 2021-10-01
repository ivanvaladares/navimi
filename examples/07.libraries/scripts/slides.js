(() => {
    return class main {

        constructor(navimiFunctions, { myfx, linksFx }) {
            this.nfx = navimiFunctions;
            this.myfx = myfx;
            this.linksFx = linksFx;
        }

        init = async (context) => {
            this.myfx.renderWrapper(this.nfx);
            this.myfx.renderRoutePage(this.nfx, context);
            this.linksFx.setActiveMenu(context.url);

            await this.nfx.addLibrary([
                "https://unpkg.com/dayjs@1.8.21/dayjs.min.js",
                "https://cdnjs.cloudflare.com/ajax/libs/tiny-slider/2.9.3/tiny-slider.css",
                "https://cdnjs.cloudflare.com/ajax/libs/tiny-slider/2.9.2/min/tiny-slider.js"
            ]);

            console.log(dayjs().format('YYYY-MM-DD HH:mm:ss Z[Z]'));

            tns({
                container: '.my-slider',
                controls: false,
                items: 1,
                mouseDrag: true,
                responsive: {
                    640: {
                        gutter: 0,
                        items: 2
                    },
                    700: {
                        gutter: 0
                    },
                    900: {
                        items: 3
                    }
                }
            });

            document.querySelector(".my-slider").style.display = 'block';
            
        };

    };
})();
