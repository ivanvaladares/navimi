import glob from'glob';
import clean from'gulp-clean';
import gulp from'gulp';
import uglify from'gulp-uglify';
import rename from'gulp-rename';
import removeCode from'gulp-remove-code';

const paths = {
    jsSource: './dist/**/*.js',
    dirOutput: './dist',
    examples: './examples/*/scripts',
    hotPath: './examples/06.hot/scripts',
    testPath: './cypress/site/scripts',
};

gulp.task('clean', function() {
    return gulp.src(paths.dirOutput,
        { read: false, force: true })
        .on('error', function () { this.emit('end') })
        .pipe(clean());
});

gulp.task('minify', function() {
    return gulp.src(paths.jsSource)
        .pipe(removeCode({ minify: true }))
        .pipe(uglify({
            compress: {
                unused: true,
                dead_code: true
            }
        }))
        .pipe(rename({ suffix: '-min' }))
        .pipe(gulp.dest(paths.dirOutput));
});

gulp.task('copyJsToExamplesAndTest', function(done) {
    const subDirectories = glob.sync(paths.examples);

    subDirectories
        .filter(path => path !== paths.hotPath)
        .forEach(path => {
            gulp.src(paths.dirOutput + '/navimi-min.js')
                .pipe(gulp.dest(path));
        });

    gulp.src(paths.dirOutput + '/navimi-min.js')
        .pipe(gulp.dest(paths.testPath));


    gulp.src(paths.dirOutput + '/navimi.js')
        .pipe(gulp.dest(paths.hotPath));

    gulp.src(paths.dirOutput + '/navimi.js.map')
        .pipe(gulp.dest(paths.hotPath));

    done();
});
