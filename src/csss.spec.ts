describe('css.spec', () => {
    const { csss } = require('./csss');

    let navimi_css: INavimi_CSSs;
    
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

        const url = "/style.css";
        const cssBody = `
            .myRedCssClass {
                color: red;
            }
        ;`;

        fetch_data_mock[url] = cssBody;

        navimi_css.fetchCss(undefined, url).then(() => {
            expect(navimi_css.isCssLoaded(url)).toBeTruthy()
            done();
        });

    });

    test('insertCss', () => {

        const url = "/style.css";

        navimi_css.insertCss(url, "library");

        const styles = document.getElementsByTagName("style");
        expect(styles.length).toBe(1);
        expect(styles[0].innerHTML.indexOf(".myRedCssClass") > 0).toBeTruthy();

    });

    test('route css', (done) => {

        const url = "/route.css";
        const cssBody = `
            .myRouteCssClass {
                color: red;
            }
        ;`;

        fetch_data_mock[url] = cssBody;

        navimi_css.fetchCss(undefined, url).then(() => {        
            navimi_css.insertCss(url, "routeCss");

            const styles = document.getElementsByTagName("style");
            expect(styles[1].innerHTML.indexOf(".myRouteCssClass") > 0).toBeTruthy();

            done();
        });

    });

    test('route css 2', (done) => {

        const url = "/route2.css";
        const cssBody = `
            .myRoute2CssClass {
                color: red;
            }
        ;`;

        fetch_data_mock[url] = cssBody;

        navimi_css.fetchCss(undefined, url).then(() => {        
            navimi_css.insertCss(url, "routeCss");

            const styles = document.getElementsByTagName("style");
            expect(styles.length).toBe(2);
            expect(styles[1].innerHTML.indexOf(".myRouteCssClass") > 0).toBeFalsy();
            expect(styles[1].innerHTML.indexOf(".myRoute2CssClass") > 0).toBeTruthy();

            done();
        });

    });

    test('digestHot', (done) => {

        const hotPayload: hotPayload = {
            filePath: "/route2.css",
            data:  `
            .myRoute2CssNewClass {
                    color: red;
            ;`
        }

        navimi_css.digestHot(hotPayload).then(() => {

            const styles = document.getElementsByTagName("style");
            expect(styles.length).toBe(2);
            expect(styles[1].innerHTML.indexOf(".myRoute2CssClass") > 0).toBeFalsy();
            expect(styles[1].innerHTML.indexOf(".myRoute2CssNewClass") > 0).toBeTruthy();

            done();
        });        

    });

});