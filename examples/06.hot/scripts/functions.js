(() => {

    const setActiveMenu = (menuItem) => {
        document.querySelectorAll(".route").forEach(el => {
            el.classList.remove("active");
            el === menuItem && el.classList.add("active");
        });
    }

    const hookNavigation = (nfx) => {
        document.querySelectorAll(".route").forEach(el =>
            el.addEventListener('click', (e) => {
                e.preventDefault();
                nfx.navigateTo(e.target.pathname);
            })
        );
    }

    const renderSection = (nfx, selector, templateName) => {
        const template = nfx.getTemplate(templateName);
        document.querySelector(selector).innerHTML = template;
    }

    const renderWrapper = (nfx) => {
        renderSection(nfx, "body", "global-template");
        hookNavigation(nfx);
    }

    const renderRoutePage = (nfx, context) => {
        const {templateName, notFound} = context.routeItem.metadata;
        if (notFound) {
            renderSection(nfx, "body", "404");
            return;
        }
        setActiveMenu(document.querySelector(`[href='${context.url}']`));
        renderSection(nfx, "#div-content", templateName);
    }

    return { renderWrapper, renderRoutePage };
    
})();