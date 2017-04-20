const od = require("oxygendecl");

exports.Router = function Router(config) {
    if(!(this instanceof Router)) {
        return new Router(...arguments);
    }

    this.root = null;
    this.providers = new Map();

    if(config instanceof od.parser.ASTNode) {
        this.root = config;
    } else if(typeof(config) == "string") {
        this.root = od.parser.parse(config);
    } else {
        throw new TypeError("Invalid type for router config");
    }

    this.register_provider = (name, fn) => {
        if(typeof(name) != "string" || typeof(fn) != "function") {
            throw new TypeError("register_provider: Invalid types for arguments");
        }
        this.providers.set(name, fn);
    };

    this.get_resource_handler = node => {
        if(!(node instanceof od.parser.ASTNode)) {
            throw new TypeError("handle_resource: Invalid type for node");
        }

        if(!(node.resource instanceof od.parser.Resource)) {
            throw new Error("handle_resource: Invalid resource");
        }

        switch(node.resource.type) {
            case "Provider": {
                const fn = this.providers.get(node.resource.name);
                if(!fn) {
                    throw new Error("handle_resource: Provider not found: " + node.resource.name);
                }
                return fn;
            }
            //break;

            default:
            throw new TypeError("handle_resource: Unknown resource type: " + node.resource.type);
        }
    };

    this.as_middleware = (req, resp, next) => {
        let current = this.root;
        let url = req.url;

        let handler = null;

        while(url.length) {
            let found = false;
            for(const c of current.children) {
                if(url.startsWith(c.name)) {
                    current = c;
                    url = url.substring(c.name.length);
                    found = true;
                    break;
                }
            }

            if(!found) {
                if(current.name.endsWith("/")) {
                    handler = this.get_resource_handler(current);
                    break;
                } else {
                    return next();
                }
            }
        }

        if(!handler) {
            handler = this.get_resource_handler(current);
        }

        return handler(req, resp);
    };
}
