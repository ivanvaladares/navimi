(() => {
    return class main {

        init = () => {
            document.querySelector("body").innerHTML = `
                <div>
                    <h2>Page not found!!!</h2>
                    <a href="javascript:navigateTo('/')">Go back to home</a>
                </div>`;
        };
        
    };
})();