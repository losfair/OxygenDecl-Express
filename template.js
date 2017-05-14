const OxygenMark = require("oxygenmark");
const fs = require("fs");

let template_cache = new Map();

module.exports = (p, ctx) => {
    if(!p.endsWith(".omt")) {
        p += ".omt";
    }

    if(!template_cache.get(p)) {
        const src = fs.readFileSync(p);
        const om = new OxygenMark();
        om.load(src);
        template_cache.set(p, om);
    }
    const om = template_cache.get(p);

    om.clearParams();
    if(ctx.params) om.setParams(ctx.params);

    return ctx.response.send(om.render(false));
};
