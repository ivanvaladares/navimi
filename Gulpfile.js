const glob = require('glob');
const clean = require('gulp-clean');
const gulp = require('gulp');
const ts = require('gulp-typescript');
const uglify = require('gulp-uglify');
const rename = require("gulp-rename");
const header = require('gulp-header');
const removeCode = require('gulp-remove-code');
const pkg = require('./package.json');

const paths = {
    tsSource: ['./src/**/!(*.spec)*.ts'],
    jsSource: './dist/**/*.js',
    dirOutput: './dist',
    examples: './examples/*/scripts',
    hotPath: './examples/06.hot/scripts',
    testPath: './cypress/site/scripts',
};

const banner = ['/**',
  ' * Navimi v<%= pkg.version %> ',	
  ' * Developed by <%= pkg.author.name %> ',	
  ' * <%= pkg.author.email %> ',	
  ' * <%= pkg.homepage %> ',
  ' */ ',	
  ''].join('\n');

function cleanDist() {
    return gulp.src(paths.dirOutput, 
            {read: false, force: true})
            .on('error', function () { this.emit('end')})
            .pipe(clean());
}

function TSScripts() {
    let tsProject = ts.createProject('./tsconfig.json');
    tsProject.options.outFile = './navimi.js';
    return gulp.src(paths.tsSource)
        .pipe(tsProject())
        .pipe(removeCode({ dist: true, minify: false }))
        .pipe(header(banner, { pkg : pkg } ))
        .pipe(gulp.dest(paths.dirOutput));
}

function minify() {
    return gulp.src(paths.jsSource)
        .pipe(removeCode({ minify: true }))
        .pipe(uglify({
            compress: {
                unused: true, 
                dead_code: true
            }
        }))
        .pipe(header(banner, { pkg : pkg } ))
        .pipe(rename({ suffix: '-min' }))
        .pipe(gulp.dest(paths.dirOutput));
}

function copyJsToExamplesAndTest(done) {
    const subDirectories = glob.sync(paths.examples);

    subDirectories
        .filter(path => path !== paths.hotPath)
        .forEach(path => {
            gulp.src(paths.dirOutput + "/navimi-min.js")
            .pipe(gulp.dest(path));
        });

    gulp.src(paths.dirOutput + "/navimi-min.js")
        .pipe(gulp.dest(paths.testPath));


    gulp.src(paths.dirOutput + "/navimi.js")
        .pipe(gulp.dest(paths.hotPath));        

    done();
}

exports.build = gulp.series(cleanDist, TSScripts);
exports.default = gulp.series(cleanDist, TSScripts, minify, copyJsToExamplesAndTest);