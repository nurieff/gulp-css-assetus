import gulp from "gulp";
import dartSass from 'sass';
import gulpSass from 'gulp-sass';
const sass = gulpSass(dartSass);
import assetus from "../index.js";

gulp.task('css', () => {
  return gulp.src('./assets/css/*.css')
    .pipe(assetus({
      imageDirSave: 'public/images/',
      searchPrefix: 's'
    }))
    .pipe(gulp.dest('./public/css'));
});

gulp.task('scss', () => {
  return gulp.src('./assets/scss/**/*.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(assetus({
      imageDirSave: 'public/images/'
    }))
    .pipe(gulp.dest('./public/css'));
});

gulp.task("default", gulp.series(['css', 'scss']));

gulp.task("watch", () => {

  gulp.watch([
    './assets/css/*.css'
  ], ['css']);

  gulp.watch([
    './assets/scss/*.scss'
  ], ['scss']);

});