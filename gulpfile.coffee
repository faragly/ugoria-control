gulp        = require 'gulp'
browserSync = do require('browser-sync').create
browserify  = require 'browserify'
browserifyShim = require 'browserify-shim'
colors      = require 'colors'
del         = require 'del'
jade        = require 'gulp-jade'
jshint      = require 'gulp-jshint'
watchify    = require 'watchify'
minifyCSS   = require 'gulp-minify-css'
rename      = require 'gulp-rename'
sourcemaps  = require 'gulp-sourcemaps'
stylus      = require 'gulp-stylus'
uglify      = require 'gulp-uglify'
proxyMiddleware = require 'http-proxy-middleware'
nib         = require 'nib'
buffer      = require 'vinyl-buffer'
source      = require 'vinyl-source-stream'

files = [
  {
    input      : ['./src/js/app.js']
    output     : 'app.js'
    extensions : ['.js']
    destination: './public/js/'
  }
]

proxy = proxyMiddleware('/api', {target: 'http://phwebpro.azurewebsites.net', changeOrigin: true})

createBundle = (options) -> 
  params = 
    entries: options.input
    extensions: options.extensions
    cache: {}
    debug: true
    insertGlobals: true
  bundler = if global.isWatching then watchify(browserify(params)) else browserify(params)
 
  rebundle = ->
    startTime = new Date().getTime()
    bundler.bundle()
    .on 'error', ->
      console.log arguments
    .pipe source(options.output)
    .pipe buffer()
    .pipe uglify()
    .pipe rename suffix: '.min'
    .pipe gulp.dest(options.destination)
    .on 'end', ->
      time = (new Date().getTime() - startTime) / 1000
      console.log "#{options.output.cyan} was browserified: #{(time + 's').magenta}"
    .pipe browserSync.reload stream: true
  if global.isWatching
    bundler.on 'update', rebundle
 
  rebundle()
 
createBundles = (bundles) ->
  bundles.forEach (bundle) ->
    createBundle
      input      : bundle.input
      output     : bundle.output
      transform  : bundle.transform
      extensions : bundle.extensions
      destination: bundle.destination

# Собираем browserify файлы
gulp.task 'browserify', ['lint'], ->
  createBundles files

# Указываем флаг для watchify
gulp.task 'setWatch', -> 
  global.isWatching = true

# Очищаем папку public
gulp.task 'clean', -> 
  del ['./public/*'], (err, paths) -> 
    console.log 'Deleted files/folders:\n', paths.join '\n'

# Компиляция стилей css
gulp.task 'stylus', -> 
  gulp.src './src/styl/**/[^_]*.styl'
    .pipe stylus
      use: do nib
#      compress: true
    .on 'error', console.log
    .pipe do minifyCSS
    .pipe rename suffix: '.min'
    .pipe gulp.dest './public/css/'
    .pipe browserSync.stream match: '**/*.css'

# Копируем boostrap
gulp.task 'bootstrap', ->
  gulp.src './bower_components/bootstrap/dist/**/*'
    .pipe gulp.dest './public/assets/bootstrap/'

# Задача, которая компилирует jade в html
gulp.task 'jade', -> 
  gulp.src './src/[^_]*.jade'
    .pipe jade pretty: true
    .on 'error', console.log 
    .pipe gulp.dest './public/' 
    .pipe browserSync.reload stream: true

# проверка качества кода
gulp.task 'lint', ->
  gulp.src './src/**/*.js'
    .pipe jshint()
    .pipe jshint.reporter('default')

# Создадим веб-сервер, чтобы работать с проектом через браузер
gulp.task 'server', ['watch'], -> 
  browserSync.init({
    server: {
      baseDir: "./public",
      middleware: [proxy]
    }, port: 8080})
  console.log 'Сервер работает по адресу http://localhost:8080'

# Создадим задачу, смотрящую за изменениями
gulp.task 'watch', ['setWatch', 'browserify', 'jade', 'stylus', 'bootstrap'], -> 
  gulp.watch './src/styl/**/*.styl', ['stylus']
  gulp.watch './src/*.jade', ['jade']
  gulp.watch './src/**/*.js', ['lint']
  return

gulp.task 'default', ['server']