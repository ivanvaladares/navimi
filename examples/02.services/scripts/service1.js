(() => {

    const render = (nfx, selector, templateName) => {
        const template = nfx.getTemplate(templateName);
        document.querySelector(selector).innerHTML = template;
    }

    const renderWrapper = (nfx) => {
        if (!document.querySelector("#global-template")) {
            render(nfx, "body", "global-template");
        }
    }

    const renderRoutePage = (nfx, context) => {
        const {templateName, notFound} = context.routeItem.metadata;
        if (notFound) {
            render(nfx, "body", "404");
            return;
        }
        render(nfx, "#div-content", templateName);
    }

    return { renderWrapper, renderRoutePage };
    
})();