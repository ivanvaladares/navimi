const glob = require('glob');
const clean = require('gulp-clean');
const gulp = require('gulp');
const ts = require('gulp-typescript');
//const minify = require('gulp-minify');
const uglify = require('gulp-uglify');
const rename = require("gulp-rename");
const header = require('gulp-header');
const sourcemaps = require('gulp-sourcemaps');
const pkg = require('./package.json');

const paths = {
    tsSource: './src/**/*.ts',
    jsSource: './dist/**/*.js',
    dirOutput: './dist',
    examples: './examples/*/scripts',
    test: './cypress/site/scripts',
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
            .pipe(clean());
}

function TSScripts() {
    var tsProject = ts.createProject('./tsconfig.json');
    return gulp.src(paths.tsSource)
        .pipe(sourcemaps.init())
        .pipe(tsProject())
        .pipe(gulp.dest(paths.dirOutput));
}

function minify() {
    return gulp.src(paths.jsSource)
        .pipe(uglify({
            compress: {
                global_defs: {
                    DEV: false,
                    PROD: true
                }
            }
        }))
        .pipe(header(banner, { pkg : pkg } ))
        .pipe(rename({ suffix: '-min' }))
        .pipe(gulp.dest(paths.dirOutput));
}

function copyMinToExamples(done) {
    const subDirectories = glob.sync(paths.examples);
    subDirectories.forEach(function (subDirectory) {
        gulp.src(paths.dirOutput + "/navimi-min.js")
          .pipe(gulp.dest(subDirectory));
    });

    gulp.src(paths.dirOutput + "/navimi-min.js")
        .pipe(gulp.dest(paths.test));

    done();
}

exports.build = gulp.series(cleanDist, TSScripts, minify, copyMinToExamples);
exports.default = gulp.series(cleanDist, TSScripts, minify, copyMinToExamples);