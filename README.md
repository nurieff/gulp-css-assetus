# gulp-css-assetus

Parses your CSS to find the assets and then saves (or convert to inline) and compresses

Easy to use



## Install
```
npm install gulp-css-assetus --save
```

## Example
#### Input SCSS
```scss
$vk: "assets/images/vk.png?name=somedir/vkontakte";
$facebook: "assets/images/facebook.png";

.vk {
  background-image: assetus-url($vk);
  background-size: assetus-size($vk);
  height: assetus-height($vk);
  width: assetus-width($vk);
}

.facebook {
  background-image: assetus-inline($facebook);
  height: assetus-height($facebook);
  width: assetus-width($facebook);
}
```

#### gulpfile.js
```javascript
import dartSass from 'sass';
import gulpSass from 'gulp-sass';
const sass = gulpSass(dartSass);
import assetus from "gulp-css-assetus";
gulp.task('scss', () => {
  return gulp.src('./assets/scss/**/*.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(assetus({
        searchPrefix: 'assetus',
        saveImage: true,
        withImagemin: true,
        withImageminPlugins: null,
        imageDirCSS: '../images/',
        imageDirSave: 'public/images/'
    }))
    .pipe(gulp.dest('./public/css'));
});
```
#### Output CSS
```css
.vk {
  background-image: url("../images/vk.png");
  background-size: 52px 52px;
  height: 52px;
  width: 52px;
}

.facebook {
  background-image: url(data:image/png;base64,...);
  height: 52px;
  width: 52px;
}
```


## Methods and options
The path relative to the root of the script
```scss
$image: "assets/images/image.png";
```

### Methods

Method | Description
------ | -----------
`assetus-url($image);` | is replaced by a relative link to the image `url("../images/icons.png")`
`assetus-size($image);` | is replaced with the size of the image
`assetus-height($image);` | is replaced by height in pixels
`assetus-width($image);` | is replaced by width in pixels
`assetus:ihw($image);` | is replaced by the image's url, height and width of the image `background-image: url("../images/image.png);height:30px;width:30px;`

### Inline options
```
$image: "assets/images/image.png?name=newimage";
```
- **name** — another name of the image to save


## Plugin options
```javascript
// ...
.pipe(assetus({
    searchPrefix: "assetus",
    saveImage: true,
    withImagemin: true,
    withImageminPlugins: [
        imageminPngquant({
           quality: [.6, .7],
           speed: 1
       })
    ],
    imageDirCSS: "../images/",
    imageDirSave: "public/images/"
}))
// ...
``` 
***
**saveImage**

Save or don't save. Defaults to `true`

If you use `assetus-inline`, the image will not be saved

***
**withImagemin**

Compression of the image using [imagemin][]. Defaults to `true`

Images of `assetus-inline` are compressed too

***
**withImageminPlugins** 

Specify what to use plugins for. Defaults to `[require('imagemin-pngquant')({quality: "60-70",speed: 1})]`

***
**imageDirCSS**

Relative URL (background-image) which is replaced in position in your CSS. Defaults to `../images/`


***
**imageDirSave**

The path where to save the images relative to the root of the script. Defaults to `public/images/`

***
**searchPrefix**

If you want to use a different prefix, then this option is for you.
Defaults to `assetus`

*gulpfile.js*

```javascript
// ...
.pipe(assetus({
    searchPrefix: "myprefix"
}))
// ...
```
Now you can now use

*SCSS*
```scss
.icon {
    background-image: myprefix-url($image);
    background-size: myprefix-size($image);
}
```

## Expert mode
### gulpfile.js
```javascript
import gulp from "gulp";
import dartSass from 'sass';
import gulpSass from 'gulp-sass';
import assetus from "gulp-css-assetus";
import imagemin from "gulp-imagemin";
import cssnano from "gulp-cssnano";
import imageminPngquant from "imagemin-pngquant";
import imageminMozjpeg from "imagemin-mozjpeg";
import buffer from "vinyl-buffer";
import merge from "merge-buffer";
const sass = gulpSass(dartSass);

gulp.task("scss", () => {
    const assetus = gulp.src("./scss/**/*.scss")
        .pipe(sourcemaps.init())
        .pipe(sass().on("error", sass.logError))
        .pipe(assetus({
            saveImage: false,
            withImagemin: false,
            withImageminPlugins: null,
            imageDirCSS: "../images/",
            imageDirSave: "public/images/"
        }));

    // Stream CSS
    const stream_css = assetus.css
        .pipe(cssnano())
        .pipe(sourcemaps.write())
        .pipe(gulp.dest("./public/css"));

    // Stream images
    const stream_img = assetus.img
        .pipe(buffer())
        .pipe(imagemin(
            [
                imageminMozjpeg(),
                imageminPngquant({
                    quality: [.6, .7],
                    speed: 1
                })
            ]
        ))
        .pipe(gulp.dest("./public/images"));
});
```