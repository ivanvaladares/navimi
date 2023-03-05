import { setNavimiLinks } from "./setNavimiLinks";

describe('setNavimiLinks.spec', () => {

    it('setNavimiLinks', () => {

        //@ts-ignore
        window.navigateTo = jest.fn();

        const newlink = document.createElement('a');
        newlink.innerHTML = 'Google';
        newlink.setAttribute('navimi-link', '');
        newlink.setAttribute('link-test', '');
        newlink.setAttribute('href', '/about');
        document.body.appendChild(newlink);

        setNavimiLinks();

        newlink.click();

        //@ts-ignore
        expect(window.navigateTo).toHaveBeenCalled();

    });

});
