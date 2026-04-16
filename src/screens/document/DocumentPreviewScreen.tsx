import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { DocumentStackParamList } from '../../navigation/types';
import { Colors } from '../../constants/colors';
import AppButton from '../../components/common/AppButton';
import { getDocumentById, saveDocument } from '../../storage/documentStorage';
import { exportToPdf } from '../../utils/pdfExport';

type Props = {
  navigation: NativeStackNavigationProp<DocumentStackParamList, 'DocumentPreview'>;
  route: RouteProp<DocumentStackParamList, 'DocumentPreview'>;
};

export default function DocumentPreviewScreen({ route }: Props) {
  const { documentId, renderedHtml, title } = route.params;
  const [html, setHtml] = useState(renderedHtml ?? '');
  const [exporting, setExporting] = useState(false);
  const [loading, setLoading] = useState(!renderedHtml);

  useEffect(() => {
    if (documentId && !renderedHtml) {
      getDocumentById(documentId).then((doc) => {
        if (doc) setHtml(doc.renderedHtml);
        setLoading(false);
      });
    }
  }, [documentId, renderedHtml]);

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportToPdf(html, (title ?? 'documento') + '.pdf');
      if (documentId) {
        const doc = await getDocumentById(documentId);
        if (doc) {
          await saveDocument({ ...doc, status: 'exported', exportedAt: new Date().toISOString() });
        }
      }
    } catch {
      Alert.alert('Error', 'No se pudo exportar el PDF.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <View style={styles.flex}>
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <WebView
          source={{ html }}
          style={styles.webview}
          originWhitelist={['*']}
          scalesPageToFit
        />
      )}
      <View style={styles.footer}>
        <AppButton
          title={exporting ? 'Exportando...' : '📄  Exportar PDF'}
          onPress={handleExport}
          loading={exporting}
          style={styles.exportBtn}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  webview: { flex: 1 },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  footer: {
    padding: 16,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  exportBtn: {},
});
