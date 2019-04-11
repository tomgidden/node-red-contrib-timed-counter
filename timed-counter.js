module.exports = function(RED) {
    'use strict';

    function TimedCounter(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        // Milliseconds for the timeout
        node.timelimit = parseInt(config.timelimit) * config.timeunit;

        // Should we only send the final message at the end of the
        // timeout, or send them all as they arrive but tagged with count?
        node.withhold = !!config.withhold;

        // Should we have a limited fixed timeout period for clicks to
        // accumulate, or do we keep counting until we stop clicking?
        node.fixedtimeout = !!config.fixedtimeout;

        // Should we count messages per topic, or just use a single
        // timer/count for all incoming messages?
        node.pertopic = !!config.pertopic;

        var TimedCounterHandler = function () {
            return {
                buffer: undefined,  // The last message to be received, so the final message to be posted (if we're withholding)
                count: 0,           // Number of clicks in the current run
                timeout: undefined, // The current timeout handle

                input: function (msg) {

                    var handler = this;

                    // If the message has a 'reset' property, reset the timer and the count.
                    if (undefined !== msg['reset']) {
                        msg.count = handler.count = 0;
                        handler.buffer = undefined;

                        // Clear any running timer
                        if (undefined !== handler.timeout) {
                            clearTimeout(handler.timeout);
                            handler.timeout = undefined;
                        }

                        // This will NOT start the timer, as otherwise we'd
                        // get the reset message passed through if no other
                        // things arrive.  If we're withholding, this means
                        // the reset message will disappear; if we're not
                        // withholding, then the reset message will flow
                        // through.
                    }
                    else {
                        // Normal message received (not a reset)

                        // If we have no timeout, start the process...
                        if (undefined === handler.timeout) {
                            // Reset the count
                            msg.count = handler.count = 0;
                        }
                        else if (! node.fixedtimeout) {
                            // If fixedtimeout is false, then each time a message
                            // is received within the timeout, the timeout is
                            // reset. So, if the timeout is 2 seconds, and a
                            // message is received every second, it'll keep
                            // counting them until the messages stop.
                            clearTimeout(handler.timeout);
                            handler.timeout = undefined;
                        } else {
                            // Otherwise, it'll only count messages within the
                            // fixed time limit once the timer is started.
                        }

                        // Increment the count
                        handler.count ++;
                        // And store in the message
                        msg.count = handler.count;

                        if (undefined === handler.timeout) {
                            // Now, if the timeout is unset (as earlier) or
                            // the !fixedtimeout check has invalidated the
                            // last one, then set it again.  (If not, the
                            // existing one should still be valid.)

                            handler.timeout = setTimeout(function () {
                                // First things first: clear the timeout
                                // properly.
                                handler.timeout = undefined;

                                // Now, if we are withholding message(s) until
                                // expiry, we need to finally dispatch.
                                if (handler.buffer) {
                                    node.send(handler.buffer);
                                    handler.buffer = undefined;
                                }
                            }, node.timelimit);
                        }
                    }

                    // At this point, we may have either a reset message with
                    // count=0 and no timeout, or we'll have a real message
                    // with a count > 0 and there should be a timeout running.

                    if ( node.withhold ) {
                        // If withholding, store the most recently received
                        // message, and just send the last one when the timer
                        // finally expires.
                        handler.buffer = msg;
                    }
                    else {
                        // If withhold is false, so send the messages tagged with
                        // the count immediately as normal: this node will not
                        // impede flow, but just tag the count value.
                        node.send(msg);
                    }
                }
            };
        };

        var handlers = [];

        var getHandler = function (topic) {
            // If there's no handler for this topic, create one
            if (undefined === handlers[topic]) {
                node.warn("Creating handler for "+topic);
                handlers[topic] = TimedCounterHandler();
            }

            // and retrieve it regardless
            return handlers[topic];
        };

        // Handle an incoming message
        node.on('input', function(msg) {

            var handler;
            if (node.pertopic) {
                // Use a handler for each topic
                handler = getHandler(msg.topic);
            }
            else {
                // Use a single handler for all messages
                handler = getHandler('all');
            }

            return handler.input(msg);
        });
    }

    RED.nodes.registerType("timed-counter",TimedCounter);
}
