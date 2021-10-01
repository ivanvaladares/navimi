(() => {

    const setActiveMenu = (url) => {
        document.querySelectorAll(".route").forEach(el => {
            el.classList.remove("active");
            el.pathname.toLowerCase() === url.toLowerCase() && el.classList.add("active");
        });
    }

    return { setActiveMenu };
    
})();