(() => {

    const hookNavigation = (nfx) => {
        document.querySelectorAll(".route").forEach(el =>
            el.addEventListener('click', (e) => {
                e.preventDefault();
                nfx.navigateTo(e.target.pathname);
            })
        );
    }

    const getTemplate = (nfx, templateName) => {
        const template = nfx.getTemplate(templateName);
        const header = nfx.getTemplate("header-template");
        return template.replace("#{header}", header);
    }

    const renderTemplate = (nfx, templateName) => {
        const template = getTemplate(nfx, templateName);
        document.querySelector("body").innerHTML = template;
        hookNavigation(nfx);
    }

    return { renderTemplate, getTemplate, hookNavigation };
    
})();