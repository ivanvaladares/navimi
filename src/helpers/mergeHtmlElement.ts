export const mergeHtmlElement = (templateNode: Element, documentNode: Element, callback: (template: Element, node: Element | DocumentFragment) => void): void => {
    // Clear child nodes
    if (documentNode.childNodes.length > 0 && !templateNode.childNodes.length) {
        documentNode.innerHTML = '';
        return;
    }

    // Prepare empty node for next round
    if (!documentNode.childNodes.length && templateNode.childNodes.length) {
        const fragment = document.createDocumentFragment();
        callback(templateNode, fragment);
        documentNode.appendChild(fragment);
        return;
    }

    // Dive deeper into the tree
    if (templateNode.childNodes.length > 0) {
        callback(templateNode, documentNode);
    }
};
