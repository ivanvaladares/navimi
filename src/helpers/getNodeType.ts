export const getNodeType = (node: Element): string => {
    switch (node.nodeType) {
        case Node.TEXT_NODE:
            return 'text';
        case Node.COMMENT_NODE:
            return 'comment';
        default:
            return node.tagName.toLowerCase();
    }
};
