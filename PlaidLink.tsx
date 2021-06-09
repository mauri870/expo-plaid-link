import React, { useRef } from 'react'
import { WebView, WebViewErrorEvent } from 'react-native-webview'
import {
  LinkEvent,
  LinkExit,
  LinkSuccess,
  LinkErrorCode,
  LinkErrorType,
  LinkExitMetadataStatus,
} from './types'
import queryString from 'query-string'
interface PlaidLinkProps {
  linkToken: string
  onEvent?(event: LinkEvent): any
  onExit?(exit: LinkExit): any
  onReady?(): any
  onError?(event: WebViewErrorEvent, webview: any): any
  onSuccess?(success: LinkSuccess): any
}

const injectedJavaScript = `(function() {
  window.postMessage = function(data) {
    window.ReactNativeWebView.postMessage(data);
  };
})()`

export default function PlaidLink({
  linkToken,
  onEvent,
  onExit,
  onReady,
  onError,
  onSuccess,
}: PlaidLinkProps) {
  let webviewRef: any = useRef()

  const handleNavigationStateChange = (event: any) => {
    if (event.url.startsWith('https://cdn.plaid.com')) {
      return true
    }

    return false
  }

  const handlePlaidEvent = (payload: any) => {
    if (!payload.action) {
      return
    }

    const eventName = payload.action.split('::')[1] as string

    if (eventName == 'acknowledged') {
      return
    }

    const linkSessionId = payload.link_session_id as string
    const mfaType = payload.mfa_type as string
    const requestId = payload.request_id as string
    const viewName = payload.view_name as string
    const errorCode = payload.error_code as string
    const errorMessage = payload.error_message as string
    const errorType = payload.error_type as string
    const exitStatus = payload.exist_status as string
    const institutionId = payload.institution_id as string
    const institutionName = payload.institution_name as string
    const institutionSearchQuery = payload.institution_search_query as string
    const timestamp = payload.timestamp as string

    onEvent &&
      onEvent({
        eventName,
        metadata: {
          linkSessionId,
          mfaType,
          requestId,
          viewName,
          errorCode,
          errorMessage,
          errorType,
          exitStatus,
          institutionId,
          institutionName,
          institutionSearchQuery,
          timestamp,
        },
      })

    switch (eventName) {
      case 'connected':
        const publicToken = payload.metadata.public_token as string
        const { accounts } = payload.metadata
        onSuccess &&
          onSuccess({
            publicToken,
            metadata: {
              institution: {
                id: institutionId,
                name: institutionName,
              },
              accounts,
              linkSessionId,
            },
          })
        break
      case 'ready':
        onReady && onReady()
      case 'acknowledged':
        break
      case 'event':
        if (payload.eventName !== 'EXIT') {
          break
        }
      case 'exit':
        onExit &&
          onExit({
            error: {
              errorCode: LinkErrorCode[errorCode as keyof typeof LinkErrorCode],
              errorMessage: payload.error_message as string,
              errorType: LinkErrorType[errorType as keyof typeof LinkErrorType],
            },
            metadata: {
              status:
                LinkExitMetadataStatus[
                  exitStatus as keyof typeof LinkExitMetadataStatus
                ],
              institution: {
                id: institutionId,
                name: institutionName,
              },
              linkSessionId,
              requestId,
            },
          })
        break
      default:
        console.warn('Unhandled plaid event: ', payload)
    }
  }

  return (
    <WebView
      source={{
        uri: `https://cdn.plaid.com/link/v2/stable/link.html?isWebView=true&token=${linkToken}`,
      }}
      ref={(ref) => (webviewRef = ref)}
      onError={(event: WebViewErrorEvent) =>
        onError && onError(event, webviewRef)
      }
      onReady={() => onReady && onReady()}
      originWhitelist={['https://*']}
      onShouldStartLoadWithRequest={handleNavigationStateChange}
      injectedJavaScript={injectedJavaScript}
      onMessage={(ev) => {
        if (ev.nativeEvent.data) {
          try {
            const evt = JSON.parse(ev.nativeEvent.data)
            handlePlaidEvent(evt)
          } catch (e) {}
        }
      }}
    />
  )
}
