import React from 'react'
import PlaidLink from '.'
import Config from './config'

export default function App() {
  return (
    <PlaidLink
      linkToken={Config.TEST_LINK_TOKEN}
      onEvent={(event) => console.log(event)}
      onExit={(exit) => console.log(exit)}
      onReady={() => console.log("Plaid ready")}
      onError={(event, webview) => {}}
      onSuccess={(success) => console.log(success)}
    />
  )
}
