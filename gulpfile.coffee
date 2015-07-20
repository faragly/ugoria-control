gulp        = require 'gulp'
browserSync = do require('browser-sync').create
browserify  = require 'browserify'
browserifyShim = require 'browserify-shim'
colors      = require 'colors'
concat      = require 'gulp-concat'
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
templateCache = require 'gulp-angular-templatecache'

files = [
  {
    input : ['./src/js/angular-ugoria-control.js']
    output: 'angular-ugoria-control.js'
    extensions: ['.js']
    destination: './dist/js/'
  },
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
    #debug: true
    #insertGlobals: true
  bundler = if global.isWatching then watchify(browserify(params)) else browserify(params)
 
  rebundle = ->
    startTime = new Date().getTime()
    bundler.bundle()
    .on 'error', ->
      console.log arguments
    .pipe source(options.output)
    .pipe gulp.dest(options.destination)
    .pipe buffer()
    .pipe sourcemaps.init loadMaps: true
    .pipe uglify()
    .pipe rename suffix: '.min'
    .pipe sourcemaps.write('.')
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
      #transform  : bundle.transform
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
  del ['./public/*', './dist/*'], (err, paths) -> 
    console.log 'Deleted files/folders:\n', paths.join '\n'

# Компиляция стилей css
gulp.task 'stylus', -> 
  gulp.src './src/styl/**/[^_]*.styl'
    .pipe stylus
      use: do nib
#      compress: true
    .on 'error', console.log
    #.pipe do minifyCSS
    #.pipe rename suffix: '.min'
    .pipe gulp.dest './public/css/'
    .pipe browserSync.stream match: '**/*.css'

# собираем css
gulp.task 'css', ['stylus'], ->
  gulp.src([
    './bower_components/marx/css/marx.min.css',
    './public/css/styles.css'
    ])
    .pipe concat('styles.min.css')
    .pipe do minifyCSS
    .pipe gulp.dest './public/css/'
    .pipe gulp.dest './dist/css/'
    .pipe browserSync.stream match: '**/*.css'

# Задача, которая компилирует jade в html
gulp.task 'jade', -> 
  gulp.src './src/[^_]*.jade'
    .pipe jade pretty: true
    .on 'error', console.log 
    .pipe gulp.dest './public/' 
    .pipe browserSync.reload stream: true

# Генерация angular-шаблонов в файл templates.js
gulp.task 'templates', ->
  gulp.src('./src/templates/**/*.jade')
    .pipe jade pretty: true
    .on 'error', console.log 
    .pipe templateCache('templates.js', {moduleSystem: 'Browserify'})
    .pipe gulp.dest('./src/js/')

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
gulp.task 'watch', ['setWatch', 'browserify', 'jade', 'templates', 'stylus', 'css'], -> 
  gulp.watch './src/styl/**/*.styl', ['css']
  gulp.watch './src/*.jade', ['jade']
  gulp.watch './src/templates/**/*.jade', ['templates']
  gulp.watch './src/**/*.js', ['lint']
  return

gulp.task 'build', ['browserify', 'jade', 'templates', 'stylus', 'css']

gulp.task 'default', ['server']