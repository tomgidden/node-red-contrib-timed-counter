module.exports = function(RED) {

    function TimedCounter(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        node.timelimit = parseInt(config.timelimit);
        node.withhold = !!config.withhold;
        node.fixedtimeout = !!config.fixedtimeout;

        node.on('input', function(msg) {
            if (undefined === node.timeout) {
                // Reset the count
                node.count = 1;
                // And store the message
                msg.count = node.count;
            }
            else {
                if (! this.fixedtimeout) {
                    // If fixedtimeout is false, then each time a message
                    // is received within the timeout, the timeout is
                    // reset. So, if the timeout is 2 seconds, and a
                    // message is received every second, it'll keep
                    // counting them until the messages stop.
                    clearTimeout(node.timeout);
                    node.timeout = undefined;
                } else {
                    // Otherwise, it'll only count messages within the
                    // fixed time limit once the timer is started.
                }

                // Increment the count
                node.count ++;
                // And store the message
                msg.count = node.count;
            }

            if (undefined === node.timeout) {
                // Now, if the timeout is unset (as earlier) or the
                // !fixedtimeout check has invalidated the last one, then
                // set it again.  (If not, the existing one should still be valid.)

                node.timeout = setTimeout(function () {
                    // First things first: clear the timeout properly.
                    node.timeout = undefined;

                    // Now, if we are withholding message(s) until expiry,
                    // we need to finally dispatch.
                    if (node.buffer) {
                        node.send(node.buffer);
                        node.buffer = undefined;
                    }
                }, this.timelimit);
            }

            if (! this.withhold ) {
                // If withhold is false, it'll send the messages tagged
                // with the count immediately as normal: this node will
                // not impede flow, but just tag the count value.
                node.send(msg);
            }
            else {
                // Otherwise, it'll store the most recently received
                // message, and just send the last one when the timer
                // finally expires.
                node.buffer = msg;
            }
        });
    }

    RED.nodes.registerType("timed-counter",TimedCounter);
}
