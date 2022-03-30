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

            init() {
                this.wasRemoved = false;
            }

            onAfterRemove() {
                this.wasRemoved = true;
            }

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

            expect(component.childComponents.length).to.be.equal(1);

            expect(component.childComponents[0].parentComponent).to.be.equal(component);

            expect(component.innerHTML).to.be.equal('<anon-class><div>OK!</div></anon-class>');
    
            done();

        }, 10);

    });


    it('Test event handling', (done) => {

        navimiComponents.registerComponent('click-component', class {

            constructor() {
                this.lines = [];
            }

            addChild() {
                this.lines.push(`<anon-class></anon-class>`);
                this.update();
            }

            onAfterMount() {
                this.querySelector("button").addEventListener("click", this.addChild.bind(this));
            }

            render() {
                return `<div>
                            <button>Click me!</button>
                            <div id="click-component-children">
                                ${this.lines.join('\n')}
                            </div>
                        </div>`;
            }

        });

        dom.window.document.querySelector("body").insertAdjacentHTML('beforeend', `
            <click-component></click-component>
        `);

        setTimeout(() => {

            const component = dom.window.document.querySelector("click-component");

            expect(component.childComponents.length).to.be.equal(0);

            component.querySelector("button").click();

            setTimeout(() => {

                expect(component.childComponents.length).to.be.equal(1);

                expect(component.innerHTML.indexOf('<div>OK!</div>') > 0).to.be.true;

                done();

            }, 10);

        }, 10);

    });

    it('Test event handling 2', (done) => {

        const component = dom.window.document.querySelector("click-component");
        
        component.querySelector("button").click();

        setTimeout(() => {

            expect(component.childComponents.length).to.be.equal(2);

            done();

        }, 10);

    });
    
    it('Test child removal', (done) => {

        const component = dom.window.document.querySelector("click-component");
        
        component.querySelector("#click-component-children").innerHTML = '';

        setTimeout(() => {

            expect(component.childComponents.length).to.be.equal(0);

            done();

        }, 10);

    });

    it('Test parent removal', (done) => {

        const wrapperComponent = dom.window.document.querySelector("outer-component");
        const innerComponent = wrapperComponent.querySelector("anon-class");

        dom.window.document.querySelector("outer-component").outerHTML = '';

        setTimeout(() => {

            expect(wrapperComponent.childComponents.length).to.be.equal(0);

            expect(innerComponent.wasRemoved).to.be.equal(true);
   
            done();

        }, 10);

    });

    it('Test shouldUpdate 1', (done) => {

        navimiComponents.registerComponent('counter-component', class {

            shouldUpdate(prevAttributes, nextAttributes) {
                // only update if count is different
                return prevAttributes.count !== nextAttributes.count;
            }

            render() {
                return `<div id="div-count">${this.props.count}</div>
                        <div id="div-date">${new Date().getTime()}</div>`;
            }

        });

        dom.window.document.querySelector("body").insertAdjacentHTML('beforeend', `
            <counter-component count=1></counter-component>
        `);
        
        setTimeout(() => {

            const component = dom.window.document.querySelector("counter-component");
            const counter1 = component.querySelector("#div-count").innerHTML;

            expect(component.props.count).to.be.equal('1');
            expect(component.props.count).to.be.equal(counter1);

            done()

        }, 10);

    });

    
    it('Test shouldUpdate 2', (done) => {

        const component = dom.window.document.querySelector("counter-component");

        const timer1 = component.querySelector("#div-date").innerHTML;

        component.setAttribute("count", '2');

        setTimeout(() => {

            const counter2 = component.querySelector("#div-count").innerHTML;
            const timer2 = component.querySelector("#div-date").innerHTML;

            expect(component.props.count).to.be.equal('2');
            expect(component.props.count).to.be.equal(counter2);
            expect(timer1).not.to.be.equal(timer2);

            done();

        }, 10);

    });

    it('Test shouldUpdate 3', (done) => {

        const component = dom.window.document.querySelector("counter-component");

        const counter2 = component.querySelector("#div-count").innerHTML;
        const timer2 = component.querySelector("#div-date").innerHTML;

        // this should not rerender the component
        component.setAttribute("another", 'done!');

        setTimeout(() => {
            
            const counter3 = component.querySelector("#div-count").innerHTML;
            const timer3 = component.querySelector("#div-date").innerHTML;

            expect(component.props.count).to.be.equal('2');
            expect(component.props.another).to.be.equal('done!');
            expect(counter2).to.be.equal(counter3);
            expect(timer2).to.be.equal(timer3);

            done();

        }, 10);

    });

});