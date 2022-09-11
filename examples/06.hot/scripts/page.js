(() => {
    return class main {

        constructor(navimiFunctions, { myfx, linksFx }) {
            this.nfx = navimiFunctions;
            this.myfx = myfx;
            this.linksFx = linksFx;

            //watch state
            this.nfx.watchState("test.clicks", this.showCounter);
        }

        onEnter = (context) => {
            this.myfx.renderWrapper(this.nfx);
            this.myfx.renderRoutePage(this.nfx, context);
            this.linksFx.setActiveMenu(context.url);

            this.showCounter();

            const button = document.querySelector(".counter_btn");
            button && button.addEventListener('click', this.setNewState);
        };

        showCounter = (clicks) => {
            const counterEl = document.querySelector(".counter");
            if (counterEl) {
                counterEl.innerText = clicks || this.nfx.getState("test.clicks") || 0;
            }
        }

        setNewState = () => {
            let clicks = this.nfx.getState("test.clicks") || 0;
            this.nfx.setState({
                test: {
                    clicks: ++clicks
                }
            });
        }

        onLeave = () => {
            const button = document.querySelector(".counter_btn");
            button && button.removeEventListener('click', this.setNewState);
        }
    };
})();
