(() => {

    let counter = 0;

    const bla = (p) => {
        counter++
        console.log('testing: ', p, counter);
    }

    return { bla };
    
})();