(() => {
    return class main {

        constructor(routerfunctions, {myfx} ) {
            this.nfx = routerfunctions;
            this.myfx = myfx;
        }

        onEnter = async () => {
            this.myfx.renderTemplate(this.nfx, "state-template");

            //get clicks from store
            let clicks = this.nfx.getState("test.clicks") || 0;

            //show current clicks
            this.showClicks(clicks);

            //watch state
            this.nfx.watchState("test.clicks", this.showClicks);

            //button event
            document.querySelector(".counter_btn").addEventListener('click', () => {
                this.nfx.setState({
                    test: {
                        clicks: ++clicks
                    }
                });
            });
        };

        showClicks = (clicks) => {
            document.querySelector(".counter").innerText = clicks;
        }
    };
})();