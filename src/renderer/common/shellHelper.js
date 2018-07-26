const { spawn } = require('child_process')

export const exec = function(cmd, opt, onError) {
    const parts = cmd.split(/\s+/g)
    const p = spawn(parts[0], parts.slice(1), opt)
    p.on('exit', function(code) {
        var err = null
        if (code) {
            err = new Error('command "' + cmd + '" exited with wrong status code "' + code + '"')
            err.code = code
            err.cmd = cmd
        }
        if (onError) onError(err)
    })
}

export const series = function(cmds, opt, cb) {
    const execNext = function() {
        exec(cmds.shift(), opt, function(err) {
            if (err) {
                cb(err)
            } else {
                if (cmds.length) execNext()
                else cb(null)
            }
        })
    }
    execNext()
}
