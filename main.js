const od = require("oxygendecl");
const express = require("express");

exports.Router = function Router(config) {
    if(!(this instanceof Router)) {
        return new Router(...arguments);
    }

    this._router = new od.router.Router(config);
    this.register_provider = (name, fn) => this._router.register_provider(name, fn);
    this.register_middleware = (name, fn) => this._router.register_middleware(name, fn);

    this.as_middleware = (req, resp, next) => {
        try {
            this._router.dispatch(req.url.split("#")[0].split("?")[0], {
                request: req,
                response: resp
            }).then(ret => {}).catch(e => resp.send("" + e));
        } catch(e) {
            if(e instanceof od.router.RouterError) {
                return next();
            }
            return resp.send("" + e);
        }
    };
}

exports.Application = function Application({ config, providers, middlewares, listen_options }) {
    if(!(this instanceof Application)) {
        return new Application(...arguments);
    }

    this.router = new exports.Router(config);
    this.app = express();
    this.app.use(this.router.as_middleware);
    this.listen = function() {
        return this.app.listen(...arguments);
    };

    if(providers && typeof(providers) == "object") {
        for(const k in providers) {
            this.router.register_provider(k, providers[k]);
        }
    }

    if(middlewares && typeof(middlewares) == "object") {
        for(const k in middlewares) {
            this.router.register_middleware(k, middlewares[k]);
        }
    }

    if(listen_options) {
        if(listen_options instanceof Array) {
            this.app.listen(...listen_options);
        } else {
            throw new TypeError("Invalid type for listen_options");
        }
    }
};
