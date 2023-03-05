export const getNodeContent = (node: Node): string | null => {
    if (node.childNodes.length > 0) {
        return null;
    }
    return node.textContent;
};