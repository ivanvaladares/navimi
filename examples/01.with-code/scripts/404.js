(() => {
    return class main {

        onEnter = () => {
            document.querySelector("body").innerHTML = `
                <div>
                    <h2>Page not found!!!</h2>
                    <a href="/" navimi-link>Go back to home</a>
                </div>`;
        };
        
    };
})();