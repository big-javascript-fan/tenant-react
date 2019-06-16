Installation
============

Step 1:
-------
```
$ yarn install
```

Step 2:
-------
#### #Development
(For developers)
```
$ yarn run start
```

If you get error message:

> The DLL manifest is missing. Please run `npm run build:dll`

Run : `$ yarn run build:dll`, then try `yarn run start` again.

#### #Production
File `index.html` is in "/build" folder
```bash
$ yarn run build
```

