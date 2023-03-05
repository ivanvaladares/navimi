import { syncAttributes } from './syncAttributes';

describe('syncAttributes.spec', () => {

    test('syncs attributes between templateNode and documentNode when they have the same tagName', () => {
        const templateNode = document.createElement('div');
        const documentNode = document.createElement('div');
        templateNode.setAttribute('id', 'template-id');
        templateNode.setAttribute('class', 'document-class');

        syncAttributes(templateNode, documentNode);

        expect(documentNode.getAttribute('id')).toBe('template-id');
        expect(documentNode.getAttribute('class')).toBe('document-class');
    });


    test('does not sync attributes between templateNode and documentNode when they have different tagNames', () => {
        const templateNode = document.createElement('div');
        const documentNode = document.createElement('span');
        templateNode.setAttribute('id', 'template-id');
        documentNode.setAttribute('class', 'document-class');
        documentNode.setAttribute('id', 'document-id');

        syncAttributes(templateNode, documentNode);

        expect(documentNode.getAttribute('id')).toBe('document-id');
        expect(documentNode.getAttribute('class')).toBe('document-class');
    });

    test('removes attributes from documentNode when they are present in documentNode but not in templateNode', () => {
        const templateNode = document.createElement('div');
        const documentNode = document.createElement('div');
        documentNode.setAttribute('id', 'document-id');
        documentNode.setAttribute('class', 'document-class');

        syncAttributes(templateNode, documentNode);

        expect(documentNode.getAttribute('id')).toBe(null);
        expect(documentNode.getAttribute('class')).toBe(null);
    });

    test('updates attributes in documentNode when their values differ between templateNode and documentNode', () => {
        const templateNode = document.createElement('div');
        const documentNode = document.createElement('div');
        templateNode.setAttribute('id', 'template-id');
        documentNode.setAttribute('id', 'document-id');

        syncAttributes(templateNode, documentNode);

        expect(documentNode.getAttribute('id')).toBe('template-id');
    });

});
