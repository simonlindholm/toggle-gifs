toggle-gifs
===========
Start/stop GIF animations through a keyboard shortcut or by clicking them. You can also restart animations from the beginning, or disable animations by default.


Development
-----------
Requirement on OS level: `yarn` - https://yarnpkg.com/

### Commands
+ `install`     - install all packages
+ `prettier`    - run prettier on all *.js files
+ `eslint`      - run eslint on all *.js files with `--fix` option
+ `test`        - run tests once
+ `tdd`         - run tests and watch for file changes
+ `lint`        - run `web-ext lint` in ./extension
+ `dev:web`     - run webpack in development mode and watch for file changes
+ `dev:ext`     - run web-ext with `./example/gif.html` test page
+ `start`       - run development environment (`dev:web` + `dev:ext`)

### First start
*Before* you can use the addon in development, run `yarn install`.

### Problems
+ cache: after auto-reload, maybe you need to press `[ctrl]+[shift]+[r]` to make
  new new image requests.
