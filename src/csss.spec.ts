import { INavimi_CSSs } from "./@types/INavimi_CSSs";
import { INavimi_Fetch } from "./@types/INavimi_Fetch";
import { INavimi_HotPayload } from "./@types/Navimi";
import csss from "./csss";

describe('css.spec', () => {
    let navimi_css: INavimi_CSSs;
    const abortControllerMock = {
        signal: {}
    } as any;
    
    const fetch_data_mock = {} as any;
    const navimi_fetch_mock = {
        fetchFile: (url: string) => {
            if (fetch_data_mock[url]) {
                return Promise.resolve(fetch_data_mock[url]);
            }

            return Promise.reject(new Error(`File ${url} not found`));
        }
    } as INavimi_Fetch;

    beforeAll(() => {
        navimi_css = new csss() as INavimi_CSSs;
        navimi_css.init(navimi_fetch_mock)
    });

    test('fetchCss', (done) => {

        const url = '/style.css';
        const cssBody = `
            .myRedCssClass {
                color: red;
            }
        ;`;

        fetch_data_mock[url] = cssBody;

        navimi_css.fetchCss(abortControllerMock, url).then(() => {
            expect(navimi_css.isCssLoaded(url)).toBeTruthy()
            done();
        });

    });

    test('test atomic css tag', () => {
        const styles = document.querySelectorAll('style[id=__navimi__cssInJs__]');
        expect(styles.length).toBe(1);
    });

    test('test atomic css rule 1', () => {
        const classNames = navimi_css.style({
            'color': 'red',
            'font-size': '12px',
        });

        expect(classNames).toEqual('__navimi_0 __navimi_1');

        const styleTag = document.querySelector('style[id=__navimi__cssInJs__]') as HTMLStyleElement;
        //@ts-ignore
        const { cssRules } = styleTag.sheet;
        const cssArray = [].slice.call(cssRules);

        ['.__navimi_0 {color: red;}', '.__navimi_1 {font-size: 12px;}'].map((cssRule) => {
            expect(cssArray.find((x: { cssText: string; }) => x.cssText === cssRule)).toBeTruthy();
        });
    });

    test('test atomic css rule 2', () => {
        const classNames = navimi_css.style({
            'color': 'red',
            'font-size': '14px',
        });

        expect(classNames).toEqual('__navimi_0 __navimi_2');

        const styleTag = document.querySelector('style[id=__navimi__cssInJs__]') as HTMLStyleElement;
        //@ts-ignore
        const { cssRules } = styleTag.sheet;
        const cssArray = [].slice.call(cssRules);

        ['.__navimi_0 {color: red;}', '.__navimi_2 {font-size: 14px;}'].map((cssRule) => {
            expect(cssArray.find((x: { cssText: string; }) => x.cssText === cssRule)).toBeTruthy();
        });
    });

    test('test atomic css rule 3', () => {
        const classNames = navimi_css.style({
            'color': 'red',
            'font-size': '14px',
            ':hover': {
                'color': 'green'
            },
            '@media screen and (min-width: 600px)': {
                'font-size': '48px',
                ':hover': {
                    'color': 'pink'
                },
                ' > div': {
                    'color': 'red'
                }
            }
        });

        expect(classNames).toEqual('__navimi_0 __navimi_2 __navimi_3 __navimi_4 __navimi_5 __navimi_6');

        const styleTag = document.querySelector('style[id=__navimi__cssInJs__]') as HTMLStyleElement;
        //@ts-ignore
        const { cssRules } = styleTag.sheet;
        const cssArray = [].slice.call(cssRules);

        [
            '.__navimi_0 {color: red;}', 
            '.__navimi_1 {font-size: 12px;}',
            '.__navimi_2 {font-size: 14px;}',
            '.__navimi_3:hover {color: green;}', 
            '@media screen and (min-width: 600px) {.__navimi_4 {font-size: 48px;}}',
            '@media screen and (min-width: 600px) {.__navimi_5:hover {color: pink;}}',
            '@media screen and (min-width: 600px) {.__navimi_6 > div {color: red;}}'
        ].map((cssRule) => {
            expect(cssArray.find((x: { cssText: string; }) => x.cssText === cssRule)).toBeTruthy();
        });
    });


    test('insertCss', () => {

        const url = '/style.css';

        navimi_css.insertCss(url, 'library');

        const styles = document.getElementsByTagName('style');
        expect(styles.length).toBe(2);
        expect(styles[1].innerHTML.indexOf('.myRedCssClass') > 0).toBeTruthy();

    });

    test('route css', (done) => {

        const url = '/route.css';
        const cssBody = `
            .myRouteCssClass {
                color: red;
            }
        ;`;

        fetch_data_mock[url] = cssBody;

        navimi_css.fetchCss(abortControllerMock, url).then(() => {        
            navimi_css.insertCss(url, 'routeCss');

            const styles = document.getElementsByTagName('style');
            expect(styles[2].innerHTML.indexOf('.myRouteCssClass') > 0).toBeTruthy();

            done();
        });

    });

    test('route css 2', (done) => {

        const url = '/route2.css';
        const cssBody = `
            .myRoute2CssClass {
                color: red;
            }
        ;`;

        fetch_data_mock[url] = cssBody;

        navimi_css.fetchCss(abortControllerMock, url).then(() => {        
            navimi_css.insertCss(url, 'routeCss');

            const styles = document.getElementsByTagName('style');
            expect(styles.length).toBe(3);
            expect(styles[2].innerHTML.indexOf('.myRouteCssClass') > 0).toBeFalsy();
            expect(styles[2].innerHTML.indexOf('.myRoute2CssClass') > 0).toBeTruthy();

            done();
        });

    });

    test('digestHot', (done) => {

        const hotPayload: INavimi_HotPayload = {
            filePath: '/route2.css',
            data:  `
            .myRoute2CssNewClass {
                    color: red;
            ;`
        }

        navimi_css.digestHot(hotPayload).then(() => {

            const styles = document.getElementsByTagName('style');
            expect(styles.length).toBe(3);
            expect(styles[2].innerHTML.indexOf('.myRoute2CssClass') > 0).toBeFalsy();
            expect(styles[2].innerHTML.indexOf('.myRoute2CssNewClass') > 0).toBeTruthy();

            done();
        });        

    });

});