const gulp = require('gulp');
const ts = require('gulp-typescript');
const minify = require('gulp-minify');
const sourcemaps = require('gulp-sourcemaps');

const paths = {
    tsSource: './src/**/*.ts',
    dirOutput: "./dist",
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

exports.build = TSScripts;
exports.default = TSScripts;