const gulp         = require('gulp');
const sass         = require('gulp-sass');
const postcss      = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const cssnano      = require('cssnano');
const sourcemaps   = require('gulp-sourcemaps');
var svgSprite = require('gulp-svg-sprite');

// SVG Config
var config = {
  mode: {
    symbol: { // symbol mode to build the SVG
      dest: 'sprite', // destination foldeer
      sprite: 'sprite.svg', //sprite name
      example: true // Build sample page
    }
  },
  svg: {
    xmlDeclaration: false, // strip out the XML attribute
    doctypeDeclaration: false // don't include the !DOCTYPE declaration
  }
};

const run = (cb, production) => {
  gulp
    .src('client/styles/*.scss')
    .pipe(sourcemaps.init())
    .pipe(sass().on('error', sass.logError))
    .pipe(postcss(
      production
        ? [autoprefixer(), cssnano({ discardComments: { removeAll: true } })]
        : [autoprefixer()]
    ))
    .pipe(
      production
        ? sourcemaps.write('./', { addComment: false })
        : sourcemaps.write()
    )
    .pipe(gulp.dest('public/css'));
  if (typeof cb == 'function') cb();
};

gulp.task('scss:build', cb => {
  run(cb, true);
});

gulp.task('scss:watch', () => {
  run();
  return gulp.watch('client/styles/*.scss', run);
});

gulp.task('sprite-page', function() {
  return gulp.src('client/svg/**/*.svg')
    .pipe(svgSprite(config))
    .pipe(gulp.dest('client/'));
});

gulp.task('sprite-shortcut', function() {
  return gulp.src('client/sprite/sprite.svg')
    .pipe(gulp.dest('public/'));
});

gulp.task('images', function() {
  return gulp.src('client/images/*.*')
    .pipe(gulp.dest('public/images/'));
});

gulp.task('font-awesome', function() {
    return gulp.src('node_modules/font-awesome/fonts/*.*')
        .pipe(gulp.dest('public/fonts/'));
});