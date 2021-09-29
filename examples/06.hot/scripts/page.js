(() => {
    return class main {

        constructor(navimiFunctions, { myfx }) {
            this.nfx = navimiFunctions;
            this.myfx = myfx;

            //watch state
            this.nfx.watchState("test.clicks", (clicks) => {
                this.showCounter(clicks);
            })
        }

        init = (context) => {
            this.myfx.renderWrapper(this.nfx);
            this.myfx.renderRoutePage(this.nfx, context);

            this.showCounter();

            document.querySelector(".counter_btn")
                .addEventListener('click', this.setNewState);
        };

        showCounter = (clicks) => {
            document.querySelector(".counter").innerText = 
                clicks || this.nfx.getState("test.clicks") || 0;
        }

        setNewState = () => {
            let clicks = this.nfx.getState("test.clicks") || 0;

            this.nfx.setState({
                test: {
                    clicks: ++clicks
                }
            });
        }

        destroy = () => {
            document.querySelector(".counter_btn")
                .removeEventListener('click', this.setNewState);
        }
    };
})();
