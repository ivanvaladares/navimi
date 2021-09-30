(() => {
    return class main {

        constructor(navimiFunctions, {myfx} ) {
            this.nfx = navimiFunctions;
            this.myfx = myfx;
        }

        init = async (context) => {

            const template = this.myfx.getTemplate(this.nfx, "path-template");

            document.querySelector("body").innerHTML = template;
            document.querySelector("#p1").innerHTML = `p1: ${context.params.p1}`;
            document.querySelector("#p2").innerHTML = `p2: ${context.params.p2}`;

            if (context.params.queryString) {
                document.querySelector("#q1").innerHTML = `q1: ${context.params.queryString.q1}`;
                document.querySelector("#q2").innerHTML = `q2: ${context.params.queryString.q2}`;
            }
           
            this.myfx.hookNavigation(this.nfx);
        };

    };
})();
