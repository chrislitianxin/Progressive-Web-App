# Progressive-Web-App

*This is simply a personal note from exploring with PWA API released by Google for personal reference, **it is not being maintained.***

This is a guide for making your traditional web application into progressive web application by using swPrecache to auto generate service worker and using sw-toolbox for real-time caching. This is just to give your web application ability to load faster and have offline functionality with supported browser. 

This is a summary of my personal attempt to build a progressive web app and noted a few problems encountered in the process because pwa is still a concept in development and evolving. Hopefully it could help you avoid being stuck on the same problem and spend more time on the content that actually matters. Personally, I believe progressive web application is the future to come, we will not rely on native mobile apps as much except for heavy gamings etc, PWA is much easier to maintain and develope.  

## Service-Worker Implementation 
Service-worker is a scritp that allows your browser runs in the background, seperate from a webpage. The reason we try to include service worker in our application is that because of run-time caching of API calls, we can load website much faster when accessing second time. More importantly, it enables offline access for brower with service-worker support. How service worker does it? It basically caches the content you need to access so that you will be able to view it even when offline. 

This is important as it allows us to have offline-first design in mind and create applications that follows shell + content architecture that is recommended by google, offering user a more consistent experience accross different applications. 

### Steps for Service-worker Implementation

1. Install sw-Precache - [READ MORE](https://github.com/GoogleChrome/sw-precache) 
`npm install --save sw-Precache` 

2. Install sw-toolbox - [READ MORE](https://github.com/GoogleChrome/sw-toolbox) 
`bower insatll--save sw-toolbox`

3. Add the following line to your Gruntfile.js for initalization 
``` javascript
 // For sw-Precache: service worker generation
    var packageJson = require('./package.json');
    var path = require('path');
    var swPrecache = require('./node_modules/sw-precache/lib/sw-precache.js');
    var swPrecacheConfig = require('./swPrecache.config.js');
```

4. Add swPrecache environment settings in ``` grunt.initConfig() ```
Note that handleFetch is set to false in dev environment. This is to disable fetch automatically routed to cache, resulting in broken hotreload. 
```javascript
        // Service-Worker Env Configurable for SW-precahce
        swPrecache: {
            dev: {
                handleFetch: false,
                rootDir: appConfig.app
            },
            dist: {
                handleFetch: true,
                rootDir: appConfig.dist
            }
        }
```

5. Register a new task in Gruntfile.js , which link to swPrecacheConfig setting file, the reason why we isolate swPrecacheConfig files is that in the future, should we have different service configuration for different environment, it could be easily managed. 
``` javascript
  grunt.registerMultiTask('swPrecache', function() {
        var done = this.async();
        var rootDir = this.data.rootDir;
        var handleFetch = this.data.handleFetch;

        swPrecacheConfig.writeServiceWorkerFile(rootDir, handleFetch, function(error) {
            (error) ? grunt.fail.warn(error): grunt.log.writeln('[Service-Worker] Service worker generated successfully! ');
            done();
        });
    });
```

6. Modify grunt task ```serve ``` and ```build``` to include ```swPrecache:dev``` and ```swPrecache:dist``` respectively. 

7. Add the swPrecache.config.js  [Settings Details](https://github.com/GoogleChrome/sw-precache) 
``` javascript
"use strict";
module.exports = {
    writeServiceWorkerFile: function(rootDir, handleFetch, callback) {
        var packageJson = require('./package.json');
        var path = require('path');
        var swPrecache = require('./node_modules/sw-precache/lib/sw-precache.js');
        // sw-Toolbox for more options for handling dynamic caching only uncomment if needed
        // var toolbox = require('./bower_components/sw-toolbox/sw-toolbox.js');    
        var config = {
            cacheId: packageJson.name,
            navigateFallback: '/',
            handleFetch: handleFetch,
            stripPrefix: rootDir + '/',
            default: 'networkFirst',
            verbose: true,
            // Dynamically caching dependencies only when URL is requested, load dependencies that are specific to the requested page
            dynamicUrlToDependencies: {'/': [] },
            // Additional custom scripts to be included
            importScripts: [],
            // caching static resources 
            staticFileGlobs: [  rootDir + '/**.*' ],
            /*    runtime caching for specfic API calls, can be set to a few differnet mode. eg. networkFirst / cacheFirst
             *    this includes the sw-toolbox in the service-worker and get converted to sw-toolbox settings. You can 
             *    use sw-toolbox by either this or directly sw-toolbox, which offers more customisation options
             */ 
            runtimeCaching: [{
                urlPattern: /https:\/\/www\.google\.com\/.*\.json/,
                handler: 'networkFirst',
                options: {
                    cache: {
                        maxEntries: 10,
                        name: 'demo-cache'
                    }
                }
            }]
        };
        // Write config to service-worker.js in root folder
        swPrecache.write(path.join(rootDir, 'service-worker.js'), config, callback);
    }
};
```



## Push-notification Implementation  [Cloud-Messaging Docs](https://firebase.google.com/docs/cloud-messaging/js/receive)

 Push-notification is implemented using fireabase-cloud-messaging(FCM). FCM is a replacement for the Goolge-cloud-messaging (GCM).
 FCM can transfer up to 4kb payload to client app.  [Firebase-Cloud-Messaging](https://firebase.google.com/docs/cloud-messaging/js/client)

 The implementation should follow the official documentation. There are however a few caveat to avoid if possible. 

* For firebase-messaging version 3.8.0, for unknown reason, it requires a service worker file to be named firebase-messaging-sw.js. I would suggest you put background message handler in the file because it needs to be in service worker context. Even if you do not have any content, you need to have firebase-messaging-sw.js as an empty file. Otherwise it could throw an error. 
* For implementation of message handlers when in focus, it should be as normal javascripts referenced in index.html as opposed to service-worker file. 
* For ```firebase.init() ``` copy paste the configuration you get from setting up the project in firebase: [console](https://console.firebase.google.com/) -> project -> setting -> Project settings -> cloud messaging
* Add this to your manifest.json  ```"gcm_sender_id": "103953800507", ``` regardless of the project you are working with, the "gcm_sender_id" remains the same.
* You will create your own server for application: [see detailed documentation here](https://firebase.google.com/docs/cloud-messaging/server) 


 ### Sending push notifications. 
 1. get token and copy paste your token 

 2. get your server key from firebase console -> settings -> cloud messaging 

 3. CURL 
 ``` javascript 
 curl -X POST --header "Authorization: key=<Your-server-key-from-2>" \
    --Header "Content-Type: application/json" \
    https://fcm.googleapis.com/fcm/send \
    -d "{\"to\":\"<Your-token-from-1>\",\"notification\":{\"body\":\"Yellow\"},\"priority\":10}"
 ```
