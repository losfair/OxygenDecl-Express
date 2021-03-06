const lib = require("./main.js");

const config = `
/ => (log_to_console) {
    hello_world => Provider(hello_world_provider)
    test_dir/ => Provider(test_dir_provider)
    test_message => Message(Test message)
    404 => Error(404)
    delayed/ => (delay_one_second) (print_hello_world) {
        hello_world => Provider(hello_world_provider)
        throw_error => (throw_error) Provider(hello_world_provider)
    }
    test_template => (counter_add_one) Template(test_template)
}
`;

let counter = 1;

const app = new lib.Application({
    config: config,
    providers: {
        hello_world_provider: ctx => ctx.response.send("Hello world"),
        test_dir_provider: ctx => ctx.response.send(ctx.request.url)
    },
    middlewares: {
        log_to_console: ctx => console.log(ctx.request),
        delay_one_second: ctx => new Promise(cb => setTimeout(() => cb(), 1000)),
        print_hello_world: ctx => console.log("Hello world"),
        throw_error: ctx => {
            throw new Error("Test error");
        },
        counter_add_one: ctx => {
            ctx.params = {
                counter: (counter++).toString()
            };
        }
    },
    resource_handlers: {
        Message: (msg, ctx) => ctx.response.send(msg)
    },
    listen_options: [ 8323 ]
});
