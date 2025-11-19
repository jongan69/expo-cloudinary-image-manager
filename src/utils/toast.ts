import Toast, { ToastShowParams } from 'react-native-toast-message';

const defaultOptions: Partial<ToastShowParams> = {
  position: 'bottom',
  visibilityTime: 4000,
};

const showToast = (type: ToastShowParams['type'], message: string, options?: Partial<ToastShowParams>) => {
  Toast.show({
    ...defaultOptions,
    ...options,
    type,
    text1: message,
  });
};

export const showSuccessToast = (message: string, options?: Partial<ToastShowParams>) =>
  showToast('success', message, options);

export const showErrorToast = (message: string, options?: Partial<ToastShowParams>) =>
  showToast('error', message, options);

export const showInfoToast = (message: string, options?: Partial<ToastShowParams>) =>
  showToast('info', message, options);

export const showWarningToast = (message: string, options?: Partial<ToastShowParams>) =>
  showToast('info', message, options);

export const ToastRoot = Toast;
