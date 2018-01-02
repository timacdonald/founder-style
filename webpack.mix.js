const argv = require('yargs').argv
const command = require('node-cmd')
const mix = require('laravel-mix')
const OnBuild = require('on-build-webpack')
const Watch = require('webpack-watch')
const tailwind = require('tailwindcss')
const glob = require('glob-all')
let PurgecssPlugin = require("purgecss-webpack-plugin")
const fs = require('fs')

const env = argv.e || argv.env || 'local'
const plugins = [
    new OnBuild(() => {
        command.get('./vendor/bin/jigsaw build ' + env, (error, stdout, stderr) => {
            if (error) {
                console.log(stderr)
                process.exit(1)
            }
            console.log(stdout)
        })
    }),
    new Watch({
        paths: ['source/**/*.md', 'source/**/*.php'],
        options: { ignoreInitial: true }
    }),
]

class TailwindExtractor {
  static extract(content) {
    return content.match(/[A-z0-9-:\/]+/g);
  }
}

mix.webpackConfig({ plugins })
mix.setPublicPath('source')

mix
  .js('source/_assets/js/app.js', 'source/js')
  .less('source/_assets/less/main.less', 'source/css')
  .options({
    postCss: [
      tailwind('tailwind.js'),
    ]
  })
  .version();

if (mix.inProduction()) {
    mix.webpackConfig({
      plugins: [
        new PurgecssPlugin({
          paths: glob.sync([
            path.join(__dirname, "source/_assets/**/*.blade.php"),
            path.join(__dirname, "source/_layouts/**/*.blade.php")
          ]),
          extractors: [
            {
              extractor: TailwindExtractor,
              extensions: ["php"]
            }
          ],
          whitelist: [
            'code[class*="language-"]',
            'pre[class*="language-"]',
            'pre[class*="language-"]::-moz-selection, pre[class*="language-"] ::-moz-selection',
            'code[class*="language-"]::-moz-selection, code[class*="language-"] ::-moz-selection',
            'pre[class*="language-"]::selection, pre[class*="language-"] ::selection',
            'code[class*="language-"]::selection, code[class*="language-"] ::selection',
            'pre',
            ':not(pre) > code[class*="language-"]',
            'pre[class*="language-"]',
            ':not(pre) > code[class*="language-"]',
            '.namespace',
            'code.language-diff, pre.language-diff',
            '.language-css .token.string',
            '.style .token.string',
          ],
          whitelistPatterns: [/\.token\..+/]
        })
      ]
    });
}

