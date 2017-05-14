const od = require("oxygendecl");
const express = require("express");

const BUILTIN_RESOURCE_HANDLERS = {
    Template: require("./template.js")
};

const HTTP_ERROR_MESSAGES = {
    "403": "Forbidden",
    "404": "Not Found",
    "500": "Internal Server Error"
};

exports.Router = function Router(config) {
    if(!(this instanceof Router)) {
        return new Router(...arguments);
    }

    this._router = new od.router.Router(config);
    this.register_resource_handler = (name, fn) => this._router.register_resource_handler(name, fn);
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

exports.Application = function Application({ config, providers, middlewares, resource_handlers, listen_options }) {
    if(!(this instanceof Application)) {
        return new Application(...arguments);
    }

    this.router = new exports.Router(config);
    this.app = express();
    this.app.use(this.router.as_middleware);
    this.listen = function() {
        return this.app.listen(...arguments);
    };

    this.router.register_resource_handler("Error", (code, ctx) => {
        ctx.response.status(parseInt(code));
        msg = HTTP_ERROR_MESSAGES[code] || ("Error " + code);
        return ctx.response.send(msg);
    });

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

    for(const k in BUILTIN_RESOURCE_HANDLERS) {
        this.router.register_resource_handler(k, BUILTIN_RESOURCE_HANDLERS[k]);
    }

    if(resource_handlers && typeof(resource_handlers) == "object") {
        for(const k in resource_handlers) {
            this.router.register_resource_handler(k, resource_handlers[k]);
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
