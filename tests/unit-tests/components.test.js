const mocha = require('mocha');
const chai = require('chai');

const describe = mocha.describe;
const before = mocha.before;
const it = mocha.it;
const expect = chai.expect;

const _getClasses = new require('./_getClasses');

let dom;
let navimiComponents;

describe('Test components -', () => {

    before(done => {

        _getClasses.getClasses((classes, _dom) => {

            const helpers = new classes['__Navimi_Helpers']();
            navimiComponents = new classes['__Navimi_Components']();
            navimiComponents.init(helpers);
            dom = _dom;

            done();

        });

    });

    it('Test anonymous class', (done) => {

        navimiComponents.registerComponent('anon-class', class {

            render() {
                return `<div>OK!</div>`
            }

        });

        dom.window.document.querySelector("body").insertAdjacentHTML('beforeend', `
            <anon-class></anon-class>
        `);

        setTimeout(() => {

            const html = dom.window.document.querySelector("anon-class").innerHTML;

            expect(html).to.be.equal('<div>OK!</div>');
    
            done();

        }, 10);

    });

    it('Test named class', (done) => {

        class NamedClass {

            render() {
                return `<div>OK!</div>`
            }

        }

        navimiComponents.registerComponent('named-class', NamedClass);

        dom.window.document.querySelector("body").insertAdjacentHTML('beforeend', `
            <named-class></named-class>
        `);

        setTimeout(() => {

            const html = dom.window.document.querySelector("named-class").innerHTML;

            expect(html).to.be.equal('<div>OK!</div>');
    
            done();
            
        }, 10);

    });
   
    it('Test nested component', (done) => {

        navimiComponents.registerComponent('outer-component', class {

            render() {
                return `<anon-class></anon-class>`
            }

        });

        dom.window.document.querySelector("body").insertAdjacentHTML('beforeend', `
            <outer-component></outer-component>
        `);

        setTimeout(() => {

            const component = dom.window.document.querySelector("outer-component");

            expect(component.props.childComponents.length).to.be.equal(1);

            expect(component.props.childComponents[0].props.parentComponent).to.be.equal(component);

            expect(component.innerHTML).to.be.equal('<anon-class><div>OK!</div></anon-class>');
    
            done();

        }, 10);

    });


    it('Test event', (done) => {

        navimiComponents.registerComponent('click-component', class {

            addChild() {
                this.querySelector("#click-component-children").insertAdjacentHTML('beforeend', `
                    <anon-class></anon-class>
                `);
            }

            render() {
                return `<button onclick="this.addChild()"></button>
                        <div id="click-component-children"></div>`;
            }

        });

        dom.window.document.querySelector("body").insertAdjacentHTML('beforeend', `
            <click-component></click-component>
        `);

        setTimeout(() => {

            const component = dom.window.document.querySelector("click-component");

            expect(component.props.childComponents).to.be.equal(undefined);

            component.querySelector("button").click();

            setTimeout(() => {

                expect(component.props.childComponents.length).to.be.equal(1);

                expect(component.innerHTML.indexOf('<div>OK!</div>') > 0).to.be.true;

                done();

            }, 10);

        }, 10);

    });

    it('Test event 2', (done) => {

        const component = dom.window.document.querySelector("click-component");
        
        component.querySelector("button").click();

        setTimeout(() => {

            expect(component.props.childComponents.length).to.be.equal(2);

            done();

        }, 10);

    });

});