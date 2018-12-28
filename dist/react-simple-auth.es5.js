var sessionKey = 'session';
var service = {
    acquireTokenAsync: function (provider, storage, localWindow) {
        if (storage === void 0) { storage = window.localStorage; }
        if (localWindow === void 0) { localWindow = window; }
        // Create unique request key
        var requestKey = "react-simple-auth-request-key-" + guid();
        // Create new window set to authorize url, with unique request key, and centered options
        var _a = [500, 500], width = _a[0], height = _a[1];
        var windowOptions = {
            width: width,
            height: height,
            left: Math.floor(screen.width / 2 - width / 2) +
                (screen.availLeft || 0),
            top: Math.floor(screen.height / 2 - height / 2)
        };
        var oauthAuthorizeUrl = provider.buildAuthorizeUrl(requestKey);
        var stateMatch = oauthAuthorizeUrl.match(/state=([^&]+)/);
        if (!stateMatch || stateMatch[1] !== requestKey) {
            throw new Error('React Simple Auth: state search parameter needs to be set using the generated requestKey');
        }
        var windowOptionString = Object.entries(windowOptions)
            .map(function (_a) {
            var key = _a[0], value = _a[1];
            return key + "=" + value;
        })
            .join(',');
        var loginWindow = localWindow.open(oauthAuthorizeUrl.toString(), requestKey, windowOptionString);
        return new Promise(function (resolve, reject) {
            // Poll for when the is closed
            var checkWindow = function (loginWindow) {
                // If window is still open check again later
                if (!loginWindow.closed) {
                    setTimeout(function () { return checkWindow(loginWindow); }, 100);
                    return;
                }
                var redirectUrl = storage.getItem(requestKey);
                storage.removeItem(requestKey);
                // Window was closed, but never reached the redirect.html due to user closing window or network error during authentication
                if (typeof redirectUrl !== 'string' || redirectUrl.length === 0) {
                    reject(new Error("React Simple Auth: Login window was closed by the user or authentication was incomplete and never reached final redirect page."));
                    return;
                }
                // Window was closed, and reached the redirect.html; however there still might have been error during authentication, check url
                var error = provider.extractError(redirectUrl);
                if (error) {
                    reject(error);
                    return;
                }
                // Window was closed, reached redirect.html and correctly added tokens to the url
                var session = provider.extractSession(redirectUrl);
                storage.setItem(sessionKey, JSON.stringify(session));
                resolve(session);
            };
            checkWindow(loginWindow);
        });
    },
    restoreSession: function (provider, storage) {
        if (storage === void 0) { storage = window.localStorage; }
        var sessionString = storage.getItem(sessionKey);
        if (typeof sessionString !== 'string' || sessionString.length === 0) {
            return undefined;
        }
        var session = JSON.parse(sessionString);
        if (!provider.validateSession(session)) {
            storage.removeItem(sessionKey);
            return undefined;
        }
        return session;
    },
    invalidateSession: function (storage) {
        if (storage === void 0) { storage = window.localStorage; }
        storage.removeItem(sessionKey);
    },
    getAccessToken: function (provider, resourceId, storage) {
        if (storage === void 0) { storage = window.localStorage; }
        var sessionString = storage.getItem(sessionKey);
        if (typeof sessionString !== 'string' || sessionString.length === 0) {
            throw new Error("You attempted to get access token for resource id: " + resourceId + " from the session but the session did not exist");
        }
        var session = JSON.parse(sessionString);
        return provider.getAccessToken(session, resourceId);
    }
};
function guid() {
    var d = new Date().getTime();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = ((d + Math.random() * 16) % 16) | 0;
        d = Math.floor(d / 16);
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
}

export { service };
export default service;
//# sourceMappingURL=react-simple-auth.es5.js.map
