"use strict";

module.exports = {

    writeServiceWorkerFile: function(rootDir, handleFetch, callback) {

        var packageJson = require('./package.json');
        var path = require('path');
        var swPrecache = require('./node_modules/sw-precache/lib/sw-precache.js');
        //var toolbox = require('./bower_components/sw-toolbox/sw-toolbox.js');    // sw-Toolbox for more options for hendling dynamic caching

        var config = {
            cacheId: packageJson.name,
            navigateFallback: '/#!/dashboard',
            handleFetch: handleFetch,
            stripPrefix: rootDir + '/',
            default: 'networkFirst',
            verbose: true,

            // Dynamically caching dependencies only when URL is requested, load dependencies that are specific to the requested page
            dynamicUrlToDependencies: {
                '/#!/dashboard': []
            },

            // Additional custom scripts
            importScripts: [],

            // caching static resources 
            staticFileGlobs: [
                rootDir + '/',
                rootDir + '/bower_components/**/*.{html,js,css,woff,woff2,svg,eot,ttf,otf}',
                rootDir + '/**/*.css',
                rootDir + '/**/*.js',
                rootDir + '/**/*.html',
                rootDir + '/images/**.*'
            ],

            // runtime caching for specfic API calls, can be set to a few differnet mode. eg. networkFirst / cacheFirst
            runtimeCaching: [{
                urlPattern: /https:\/\/robo-advisor-prototype\.firebaseio\.com\/.*\.json/,
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
