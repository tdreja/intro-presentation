import { type ReactElement, useCallback, useEffect } from 'react'
import { CHANNEL_NAME, type ChannelListener } from './communication/common.ts'

const channel: BroadcastChannel = new BroadcastChannel(CHANNEL_NAME)
let channelListener: ChannelListener = () => {
}

export const App = (): ReactElement => {
  const onChannelEvent: ChannelListener = useCallback<ChannelListener>((event) => {
    console.log('Received message from channel', event.data)
  }, [])
  const sendChannelEvent = useCallback(() => {
    channel.postMessage('Hello from another tab!')
  }, [])

  useEffect(() => {
    channel.removeEventListener('message', channelListener)
    channelListener = onChannelEvent
    channel.addEventListener('message', channelListener)
  }, [onChannelEvent])
  return (
    <p onClick={sendChannelEvent}>Test</p>
  )
}
