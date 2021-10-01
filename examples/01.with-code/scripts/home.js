(() => {
    return class main {

        constructor(navimiFunctions) {
            this.nfx = navimiFunctions;
        }

        init = () => {
            document.querySelector("body").innerHTML = 
                this.nfx.getTemplate("home-template");
        };
    
    };
})();
