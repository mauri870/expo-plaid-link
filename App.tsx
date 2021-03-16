import React from 'react'
import PlaidLink from './PlaidLink'

export default function App() {
  return (
    <PlaidLink
      linkToken='link-sandbox-f6e9d5a0-f496-49b8-8341-b5ef25a99fec'
      onEvent={(event) => console.log(event)}
      onExit={(exit) => console.log(exit)}
      onSuccess={(success) => console.log(success)}
    />
  )
}
