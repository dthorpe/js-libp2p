# Peer Records

All libp2p peers keep a "peer store", which maps peer ids to a set of known addresses for each peer. When the application layer wants to contact a peer, the dialer will pull addresses from the peer store and try to initiate a connection on one or more addresses.

Addresses for a peer can come from a variety of sources. If we have already made a connection to a peer, the libp2p identify protocol will inform us of other addresses that they are listening on. We may also discover their address by querying the DHT, checking a fixed "bootstrap list", or perhaps through a pubsub message or an application-specific protocol.

In the case of the identify protocol, we can be fairly certain that the addresses originate from the peer we're speaking to, assuming that we're using a secure, authenticated communication channel. However, more "ambient" discovery methods such as DHT traversal and pubsub depend on potentially untrustworthy third parties to relay address information.

Even in the case of receiving addresses via the identify protocol, our confidence that the address came directly from the peer is not actionable, because the peer store does not track the origin of an address. Once added to the peer store, all addresses are considered equally valid, regardless of their source.

We would like to have a means of distributing verifiable address records, which we can prove originated from the addressed peer itself. We also need a way to track the "provenance" of an address within libp2p's internal components such as the peer store. Once those pieces are in place, we will also need a way to prioritize addresses based on their authenticity, with the most strict strategy being to only dial certified addresses.

## Concerns (to re-read, should remove this)

While producing a signed record is fairly trivial, there are a few aspects to this problem that complicate things.

- Addresses are not static. A given peer may have several addresses at any given time, and the set of addresses can change at arbitrary times.

The first point can be addressed by having records contain a sequence number that increases monotonically when new records are issued, and by having newer records replace older ones.


## Envelop Messages

TODO: Rewrite
Sometimes we'd like to store some data in a public location (e.g. a DHT, etc), or make use of potentially untrustworthy intermediaries to relay information. It would be nice to have an all-purpose data container that includes a signature of the data, so we can verify that the data came from a specific peer and that it hasn't been tampered with.
"signed envelope" structure that contains an arbitrary byte string payload, a signature of the payload, and the public key that can be used to verify the signature.
Signatures can be used for a variety of purposes, and a signature made for a specific purpose MUST NOT be considered valid for a different purpose.
We separate signatures into "domains" by prefixing the data to be signed with a string unique to each domain. This string is not contained within the payload or the outer envelope structure. Instead, each libp2p subsystem that makes use of signed envelopes will provide their own domain string when constructing the envelope, and again when validating the envelope. If the domain string used to validate is different from the one used to sign, the signature validation will fail.

"signed envelope" structure that contains an arbitrary byte string payload, a signature of the payload, and the public key that can be used to verify the signature.
Signatures can be used for a variety of purposes, and a signature made for a specific purpose MUST NOT be considered valid for a different purpose.

// Envelope encloses a signed payload produced by a peer, along with the public
// key of the keypair it was signed with so that it can be statelessly validated
// by the receiver.
//
// The payload is prefixed with a byte string that determines the type, so it
// can be deserialized deterministically. Often, this byte string is a
// multicodec.

## Peer Record Messages

a method for distributing peer routing records, which contain a peer's publicly reachable listen addresses, and may be extended in the future to contain additional metadata relevant to routing. 

The dialer can then prioritize self-certified addresses over addresses from an unknown origin.

TODO: 
- Peer Record messages
// PeerRecord messages contain information that is useful to share with other peers.
// Currently, a PeerRecord contains the public listen addresses for a peer, but this
// is expected to expand to include other information in the future.
//
// PeerRecords are designed to be serialized to bytes and placed inside of
// SignedEnvelopes before sharing with other peers.
// See https://github.com/libp2p/go-libp2p-core/record/pb/envelope.proto for
// the SignedEnvelope definition.

// PeerRecord contains information that is broadly useful to share with other peers,
// either through a direct exchange (as in the libp2p identify protocol), or through
// a Peer Routing provider, such as a DHT.
// Currently, a PeerRecord contains the public listen addresses for a peer, but this
// is expected to expand to include other information in the future.
//
// PeerRecords are ordered in time by their Seq field. Newer PeerRecords must have
// greater Seq values than older records. The NewPeerRecord function will create


## Flows

When the DHT receives a routing record for a peer, it will hand it off to the peerstore, telling it: "memorize this".
- It's possible that the peer already had a routing record, in which case we'll replace it atomically if the incoming seq is higher.
- We add all addresses from the record into our peerstore.

When the DHT is responding to incoming FIND_PEER, FIND_PROVS, GET requests, it will need to ask the peerstore for the latest routing record of the closest peers.
- A variadic func SignedPeerRecords(ids ...peer.ID) ([]SignedPeerRecord, error) would be useful to batch the query.
- If we have no signed peer record for one or many peers, the DHT would call the existing Addrs() for those.

We should remember the latest signed peer routing all addresses expire. When that happens, the signed peer routing record would be scrapped with it.


## Possible js-libp2p current issues

Multiple parallel dials. We already have the issue where new addresses aren't added to existing dials. However, this means that parallel dials where one is more "tolerant" than the other may behave oddly.
I'd like to be able to set a default policy (e.g.: user + certified, falling back on everything else if we don't have either).

## Future Work

- Peers may not know their own addresses. It's often impossible to automatically infer one's own public address, and peers may need to rely on third party peers to inform them of their observed public addresses.
- A peer may inadvertently or maliciously sign an address that they do not control. In other words, a signature isn't a guarantee that a given address is valid.
- Some addresses may be ambiguous. For example, addresses on a private subnet are valid within that subnet but are useless on the public internet.

Future work dialer:

- At this point I don’t want to use this as an implicit/hardcoded precedence metric. With the modular dialer, users should easily be able to configure precedence. With dialer v1, anything we do to prioritise dials is gonna be spaghetti and adhoc. With the modular dialer, you’d be able to specify the order of dials when instantiating the pipeline.
