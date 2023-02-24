# nodesite-static

Installation: `pnpm i -g nodesite-static`

Usage: `nodesite-static NAME [directory] [--hl] [--md]`

-   `NAME`: your site's name
-   `directory`: whichever directory you wish to serve, defaults to the current working directory
-   `--md`: parse markdown files
-   `--hl`: enable code highlighting

You can also import this module and define your plugins.
To create a plugin, extend the `Plugin` class.
Use the `main` function to launch the server.

### Dependencies:

-   POSIX `file`
