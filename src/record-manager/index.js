'use strict'

const debug = require('debug')
const log = debug('libp2p:routing-manager')
log.error = debug('libp2p:routing-manager:error')

/**
 * Responsible for managing the node signed peer record.
 * The record is generated on start and should be regenerated when
 * the public addresses of the peer change.
 */
class RoutingManager {
  /**
   * @constructor
   * @param {Libp2p} libp2p
   */
  constructor (libp2p) {
    this.libp2p = libp2p
    this.peerRecord = undefined
  }
}

module.exports = RoutingManager
