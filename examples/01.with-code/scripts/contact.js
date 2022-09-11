(() => {
    return class main {

        constructor(navimiFunctions) {
            this.nfx = navimiFunctions;
        }

        onEnter = () => {
            document.querySelector("body").innerHTML = 
                this.nfx.getTemplate("contact-template");
        };
    
    };
})();
