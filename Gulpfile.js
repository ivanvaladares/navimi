const glob = require('glob');
const gulp = require('gulp');
const ts = require('gulp-typescript');
const minify = require('gulp-minify');
const sourcemaps = require('gulp-sourcemaps');

const paths = {
    tsSource: './src/**/*.ts',
    dirOutput: './dist',
    examples: './examples/*/scripts',
    test: './cypress/site/scripts',
};

function TSScripts() {
    var tsProject = ts.createProject('./tsconfig.json');
    return gulp.src(paths.tsSource)
        .pipe(sourcemaps.init())
        .pipe(tsProject())
        .pipe(sourcemaps.write("./"))
        .pipe(minify())
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

exports.build = gulp.series(TSScripts, copyMinToExamples);
exports.default = gulp.series(TSScripts, copyMinToExamples);