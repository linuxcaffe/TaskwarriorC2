const spawn = require('child_process').spawn;

export class TaskProvider {

    constructor(config) {
        this.config = config;
    }

    init() {
        return true;
    }

    call(args, out, err) {
        // Return promise
        const stream2out = (stream, outp) => {
            stream.setEncoding('utf8');
            stream.on('data', (data) => {
                if (out) { // Write
                    data.split('\n').forEach((line) => {
                        out.eat(line);
                    });
                };
            });
        };
        return new Promise((resp, rej) => {
            let arr = [];
            for (let s of args) {
                arr.push.apply(arr, s.split(' '));
            }
            const task = spawn(this.config.task || 'task', arr);
            stream2out(task.stdout, out);
            stream2out(task.stderr, err);
            task.on('close', (code) => {
                resp(code);
            });
            task.on('err', (err) => {
                rej(err);
            });
        });
    }
}
