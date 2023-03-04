node-red-contrib-timed-counter
==============================
A node that counts messages received in a specified time limit.

This node counts incoming messages while they are received in a configured time limit, or number of messages. When the first message comes in, a countdown timer is started. When subsequent messages arrive within the time limit the counter is incremented, so the first message gets `msg.count == 1`, the next `msg.count == 2`, and so on. When the time limit is reached, the counter is reset.

It can be configured in a couple of different ways:

*   Firstly, with a fixed timeout, so it only counts within a time limit from the first message received in a chain.
*   Alternatively, a non-fixed timeout will result in each subsequent message resetting the time limit but not the counter; so if messages continue to be received by a certain frequency, the timer will be restarted but the count kept. This allows messages to be counted without limit, as long as they keep coming in fast enough.
*   Finally, to send immediately once a number of messages are received, or the timeouts as above. (_"Count limit"_)

_"Final only"_ sets whether to allow each message to pass through (with their counts added) as they are received, or whether to withhold them and just send the last one. This is to allow for a single message to represent all of the messages in a chain. For example, if detecting a double- or triple-click of a button to determine an alternative function, the first click might not be desired if immediately followed by a second click.

So, for a typical mouse single-, double- and triple-click detector, set the _"Time limit"_ to `350` milliseconds or so, untick _"Fixed time"_, and tick _"Final only"_. The message that is eventually received will have a `msg.count` value equal to `1`, `2`, `3`, or more. A _switch_ node or a _function_ node may be used to decide how to process them.

If a message with `msg.reset` set, then the timer and count will be reset. If _"Final message"_ is set, this reset message will be lost; if it isn't set then the reset message will flow through.

_"Per-topic"_ will treat each different incoming topic as a separate counter so they're treated independently. If unticked, all messages are dealt with by the same counter regardless of topic.