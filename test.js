const express = require("express");
const lib = require("./main.js");

const app = express();
const router = new lib.Router(`
/ => {
    hello_world => Provider(hello_world_provider)
    test_dir/ => Provider(test_dir_provider)
}
`);
app.use(router.as_middleware);

router.register_provider("hello_world_provider", (req, resp) => {
    return resp.send("Hello world");
});
router.register_provider("test_dir_provider", (req, resp) => {
    return resp.send(req.url);
});

app.listen(8323);
