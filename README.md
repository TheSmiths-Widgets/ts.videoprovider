# VideoProvider [![Titanium](http://www-static.appcelerator.com/badges/titanium-git-badge-sq.png)](http://www.appcelerator.com/titanium/) [![Alloy](http://www-static.appcelerator.com/badges/alloy-git-badge-sq.png)](http://www.appcelerator.com/alloy/) [![License](http://img.shields.io/badge/license-Apache%202.0-blue.svg?style=flat)](http://choosealicense.com/licenses/apache-2.0/)

This module for the [Appcelerator](http://www.appcelerator.com) Titanium Alloy MVC framework could be used to
easily retrieve streamable url (via http) from a given provider. So far, only *Youtube* and
*Limelight* are supported. Also, some *Youtube*'s videos are protected via copyright and won't be
displayed.

## Quick Start

### Get it [![gitTio](http://gitt.io/badge.png)](http://gitt.io/component/ts.videoprovider) 

**Download this repository and install it**

* In your application's `tiapp.xml` file, add the module to the modules section: 

```xml
<modules>
    <module platform="commonjs">ts.videoprovider</module>
</modules>
```

* Copy the `ts.videoprovider-commonjs-x.x.x.zip` bundle into your root app directory.

**Or use your favorite package manager** 

- [gitTio](http://gitt.io/cli): `gittio install ts.videoprovider`

### Use it

```javascript
var VideoProvider = require('ts.videoprovider');

// Assuming there is a VideoPlayer with the id 'videoPlayer' accessible

// ------ Youtube
VideoProvider
    .getVideoUrl('youtube', /* <media_id> */)
    .then(
        function onSuccess(url) { $.videoPlayer.setUrl(url); }, 
        function onError(e) { Ti.API.error(e); }
    );

// ------ Limelight
VideoProvider.configure({
    providers: [{
        name: 'limelight',
        secretKey: /* <secret_key> */, 
        accessKey: /* <access_key> */,
        organizationId: /* <organization_id> */
    }]
});

VideoProvider
    .getVideoUrl('limelight', /* <media_id> */)
    .then(
        function onSuccess(url) { $.videoPlayer.setUrl(url); }, 
        function onError(e) { Ti.API.error(e); }
    );
```

### API

##### VideoProvider.getVideoUrl(provider, videoId) :: {Promise-like Object}

> *Get a streamable url for a given video*
>  
> - `{String}` **provider** The provider; only 'youtube' or 'limelight' so far.
> - `{String}` **id** The related video's id
>
> - **return** `{Object}` A lightweight promise-like object
>   - `{Function}` **then** Function that actually executes the async request
>       - `{Function}` **then.success** Success callback, take one parameter: the requested url.
>       - `{Function}` **then.error** Error callback, take one parameter which is the error message.

##### VideoProvider.configure(options)

> *Configure the module; i.e supply providers keys*
>  
> - `{Object}` **options**
>   - `{Array}` **options.provider** A list of providers configuration object
>
> Provider's configuration objects:  
> - **limelight**
>   - `{String}` **name** The provider name
>   - `{String}` **secretKey**
>   - `{String}` **accessKey**
>   - `{String}` **organizationId**

Remark: *Youtube* does not require any configuration. 

## Changelog
* 1.0 First version

[![wearesmiths](http://wearesmiths.com/media/logoGitHub.png)](http://wearesmiths.com)

Appcelerator, Appcelerator Titanium and associated marks and logos are trademarks of Appcelerator, Inc.  
Titanium is Copyright (c) 2008-2015 by Appcelerator, Inc. All Rights Reserved.  
Titanium is licensed under the Apache Public License (Version 2).  
