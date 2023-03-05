import { mergeHtmlElement } from "./mergeHtmlElement";

describe('mergeHtmlElement.spec', () => {

    test('clears child nodes of documentNode when documentNode has child nodes and templateNode does not', () => {
        const templateNode = document.createElement('div');
        const documentNode = document.createElement('div');
        documentNode.innerHTML = '<p>Child Node</p>';
        const callback = jest.fn();

        mergeHtmlElement(templateNode, documentNode, callback);
        expect(callback).toHaveBeenCalledTimes(0);

        expect(documentNode.innerHTML).toBe('');
    });

    test('creates and appends a document fragment to documentNode when documentNode does not have child nodes and templateNode has child nodes', () => {
        const templateNode = document.createElement('div');
        templateNode.innerHTML = '<p>Child Node</p>';
        const documentNode = document.createElement('div');
        const callback = jest.fn();

        mergeHtmlElement(templateNode, documentNode, callback);

        expect(callback).toHaveBeenCalledTimes(1);
    });

    test('calls the callback function with the correct arguments when templateNode has child nodes', () => {
        const templateNode = document.createElement('div');
        templateNode.innerHTML = '<p>Child Node</p>';
        const documentNode = document.createElement('div');
        documentNode.innerHTML = '<p>Child Node</p>';
        const callback = jest.fn();

        mergeHtmlElement(templateNode, documentNode, callback);

        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback).toHaveBeenCalledWith(templateNode, documentNode);
    });

});
