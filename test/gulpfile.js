var gulp = require('gulp')
  , assetus = require('../index')
  , sass = require('gulp-sass');

gulp.task('css', function () {
  return gulp.src('./assets/css/*.css')
    .pipe(assetus({
      imageDirSave: 'public/images/',
      searchPrefix: 's'
    }))
    .pipe(gulp.dest('./public/css'));
});

gulp.task('scss', function () {
  return gulp.src('./assets/scss/**/*.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(assetus({
      imageDirSave: 'public/images/'
    }))
    .pipe(gulp.dest('./public/css'));
});

gulp.task("default", ['css', 'scss']);

gulp.task("watch", function () {

  gulp.watch([
    './assets/css/*.css'
  ], ['css']);

  gulp.watch([
    './assets/scss/*.scss'
  ], ['scss']);

});