export const syncAttributes = (templateNode: Element, documentNode: Element): void => {
    if (templateNode.tagName.toLowerCase() !== documentNode.tagName.toLowerCase()) {
        return;
    }

    const documentNodeAttr: Attr[] = [].slice.call(documentNode.attributes);
    const templateNodeAttr: Attr[] = [].slice.call(templateNode.attributes);

    const update = templateNodeAttr.filter(templateAttr => {
        const documentAttr = documentNodeAttr.find(
            (docAttr: Attr) => templateAttr.name === docAttr.name
        );
        return documentAttr && templateAttr.value !== documentAttr.value;
    });
    const remove = documentNodeAttr.filter(
        (docAttr) => !templateNodeAttr.some((templateAttr) => docAttr.name === templateAttr.name)
    );
    const add = templateNodeAttr.filter(
        (templateAttr) => !documentNodeAttr.some((docAttr) => templateAttr.name === docAttr.name)
    );

    remove.forEach((attr) => {
        documentNode.removeAttribute(attr.name);
    });

    [...update, ...add].forEach(({ name, value }) => {
        documentNode.setAttribute(name, value);
    });
};
