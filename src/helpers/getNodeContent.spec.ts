import { getNodeContent } from "./getNodeContent";

describe('getNodeContent.spec', () => {

    test('getNodeContent', () => {
        const textNode = document.createTextNode('Text Node');
        expect(getNodeContent(textNode)).toBe('Text Node');
    
        const spanNode = document.createElement('span');
        spanNode.appendChild(document.createTextNode('Span Node'));
        expect(getNodeContent(spanNode)).toBe(null);
    });

});
