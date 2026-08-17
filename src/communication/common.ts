/**
 * Shortcut type for a listener for browser events
 */
export type ChannelListener = (event: MessageEvent) => void

/**
 * Global name of the communication channel used between intro-presentations
 */
export const CHANNEL_NAME = 'intro-presentation-channel'
