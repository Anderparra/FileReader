import React, { useState } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { WebView } from 'react-native-webview';
import { Colors } from '../../constants/colors';

interface Props {
  html: string;
  /** Minimum height in px */
  minHeight?: number;
  /** Maximum height in px; if content is taller, internal scroll is enabled as fallback */
  maxHeight?: number;
  style?: ViewStyle;
}

/**
 * Renders HTML inside a WebView with no internal vertical scroll, so it
 * plays nicely inside a parent ScrollView. The WebView reports its content
 * height back via postMessage and we resize the container.
 */
export default function InlineWebPreview({ html, minHeight = 300, maxHeight = 1600, style }: Props) {
  const [height, setHeight] = useState(minHeight);

  const heightJs = `
    (function() {
      function report() {
        var h = Math.max(
          document.documentElement.scrollHeight || 0,
          document.body ? document.body.scrollHeight : 0
        );
        if (window.ReactNativeWebView && h > 0) {
          window.ReactNativeWebView.postMessage(String(h));
        }
      }
      report();
      setTimeout(report, 60);
      setTimeout(report, 300);
      setTimeout(report, 800);
      if (typeof MutationObserver !== 'undefined' && document.body) {
        new MutationObserver(report).observe(document.body, {
          childList: true, subtree: true, characterData: true, attributes: true
        });
      }
      window.addEventListener && window.addEventListener('load', report);
    })();
    true;
  `;

  const clamped = Math.min(Math.max(height, minHeight), maxHeight);
  const needsInternalScroll = height > maxHeight;

  return (
    <View style={[styles.container, { height: clamped }, style]}>
      <WebView
        source={{ html }}
        style={styles.webview}
        originWhitelist={['*']}
        scrollEnabled={needsInternalScroll}
        nestedScrollEnabled={needsInternalScroll}
        showsVerticalScrollIndicator={needsInternalScroll}
        onMessage={(e) => {
          const h = parseInt(e.nativeEvent.data, 10);
          if (!isNaN(h) && h > 0 && Math.abs(h - height) > 4) {
            setHeight(h + 8);
          }
        }}
        injectedJavaScript={heightJs}
        javaScriptEnabled
        domStorageEnabled
        automaticallyAdjustContentInsets={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  webview: { flex: 1, backgroundColor: 'transparent' },
});
