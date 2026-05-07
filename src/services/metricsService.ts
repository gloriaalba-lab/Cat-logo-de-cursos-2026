import { collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebase';

export enum MetricType {
  STRATEGY_GENERATED = 'strategy_generated',
  STRATEGY_SAVED = 'strategy_saved',
  SEARCH_PERFORMED = 'search_performed',
  CATALOG_VIEWED = 'catalog_viewed',
  DOWNLOAD_DOCX = 'download_docx',
  DOWNLOAD_PDF = 'download_pdf',
  USER_SIGNIN = 'user_signin',
  BOOKING_CLICKED = 'booking_clicked',
  STRATEGY_SHARED = 'strategy_shared',
  NAVIGATION = 'navigation',
}

export const trackMetric = async (type: MetricType, details: any = {}) => {
  try {
    const metricsRef = collection(db, 'app_metrics');
    await addDoc(metricsRef, {
      type,
      uid: auth.currentUser?.uid || 'anonymous',
      email: auth.currentUser?.email || 'anonymous',
      details,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error tracking metric:', error);
  }
};

export const getAppMetrics = async (count = 100) => {
  try {
    const q = query(
      collection(db, 'app_metrics'),
      orderBy('timestamp', 'desc'),
      limit(count)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error fetching metrics:', error);
    return [];
  }
};
