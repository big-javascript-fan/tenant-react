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

Deployement
====================
This app is part of [VAE Tenant Portal - API](https://bitbucket.org/vaesoftware/vae-tenant-portal-api/src/master/). 
When make change to this repo, ensure all well tested and [pipeline](https://bitbucket.org/vaesoftware/vae-tenant-portal-datacollector/addon/pipelines/home)
run successfully. After that, start deploying or updating production box throught [VAE Tenant Portal - API](https://bitbucket.org/vaesoftware/vae-tenant-portal-api/src/master/). 
There is a `README.md` file to guide.
