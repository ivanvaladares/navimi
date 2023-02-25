import typescript from 'rollup-plugin-typescript2';

const banner = ['/**',
    // eslint-disable-next-line no-undef
    ` * Navimi v${process.env.npm_package_version} `,
    ' * Developed by Ivan Valadares',
    ' * ivanvaladares@hotmail.com ',
    ' * https://github.com/ivanvaladares/navimi ',
    ' */ ',
    ''].join('\n');

export default {
    input: './src/navimi.ts',
    output: [{
        banner,
        file: './dist/navimi.js',
        format: 'iife',
        name: 'Navimi',
        sourcemap: true
    }],
    plugins: [
        typescript()
    ]
};