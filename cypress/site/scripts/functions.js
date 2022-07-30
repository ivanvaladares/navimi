(() => {

    const getTemplate = (nfx, templateName) => {
        const template = nfx.getTemplate(templateName);
        const header = nfx.getTemplate("header-template");
        return template.replace("#{header}", header);
    }

    const renderTemplate = (nfx, templateName) => {
        const template = getTemplate(nfx, templateName);
        document.querySelector("body").innerHTML = template;
    }

    return { renderTemplate, getTemplate };
    
})();