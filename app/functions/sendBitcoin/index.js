import * as Clipboard from 'expo-clipboard';
import {Alert, Platform} from 'react-native';
import {WEBSITE_REGEX} from '../../constants';
import openWebBrowser from '../openWebBrowser';
import {convertMerchantQRToLightningAddress} from './getMerchantAddress';
import {getImageFromLibrary} from '../imagePickerWrapper';
import RNQRGenerator from 'rn-qr-generator';

async function getClipboardText(navigate, callLocation, nodeInformation) {
  const data = await Clipboard.getStringAsync();
  if (!data) {
    navigate.navigate('ErrorScreen', {
      errorMessage: 'No data in clipboard',
    });
    return;
  }

  if (WEBSITE_REGEX.test(data)) {
    openWebBrowser({navigate, link: data});
    return;
  }
  const merchantLNAddress = convertMerchantQRToLightningAddress({
    qrContent: data,
    network: process.env.BOLTZ_ENVIRONEMNT,
  });
  // if (Platform.OS === 'android') {
  //   navigate.navigate('ConfirmPaymentScreen', {
  //     btcAdress: merchantLNAddress || data,
  //     fromPage: callLocation === 'slideCamera' ? 'slideCamera' : '',
  //   });
  //   return;
  // }
  if (Platform.OS === 'android') {
    navigate.navigate('ConfirmPaymentScreen', {
      btcAdress: merchantLNAddress || data,
      fromPage: callLocation === 'slideCamera' ? 'slideCamera' : '',
    });
  } else {
    navigate.reset({
      index: 0,
      routes: [
        {
          name: 'HomeAdmin',
          params: {
            screen: 'Home',
          },
        },
        {
          name: 'ConfirmPaymentScreen',
          params: {
            btcAdress: merchantLNAddress || data,
            fromPage: callLocation === 'slideCamera' ? 'slideCamera' : '',
          },
        },
      ],
    });
  }

  // navigate.reset({
  //   index: 0,
  //   routes: [
  //     {
  //       name: 'HomeAdmin',
  //       params: {
  //         screen: 'Home',
  //       },
  //     },
  //     {
  //       name: 'ConfirmPaymentScreen',
  //       params: {
  //         btcAdress: merchantLNAddress || data,
  //         fromPage: callLocation === 'slideCamera' ? 'slideCamera' : '',
  //       },
  //     },
  //   ],
  // });
}

async function getQRImage(navigate, callLocation) {
  const imagePickerResponse = await getImageFromLibrary();
  const {didRun, error, imgURL} = imagePickerResponse;
  if (!didRun) return {btcAdress: '', didWork: true, error: ''};
  if (error) {
    return {btcAdress: '', didWork: false, error: error};
  }
  let address;
  console.log(imgURL.uri);

  try {
    const response = await RNQRGenerator.detect({
      uri: imgURL.uri,
    });

    console.log(response);

    if (response.type != 'QRCode')
      return {
        btcAdress: '',
        didWork: false,
        error: 'Not able to get find QRcode from image.',
      };
    if (!response.values.length)
      return {
        btcAdress: '',
        didWork: false,
        error: 'Not able to get find data from image.',
      };

    address = response.values[0];
  } catch (err) {
    console.log('get qr image error', err);
    return {
      btcAdress: '',
      didWork: false,
      error: 'Not able to get invoice from image.',
    };
  }

  if (WEBSITE_REGEX.test(address)) {
    openWebBrowser({navigate, link: address});
    return {btcAdress: '', didWork: false, error: ''};
  }
  const merchantLNAddress = convertMerchantQRToLightningAddress({
    qrContent: address,
    network: process.env.BOLTZ_ENVIRONEMNT,
  });

  return {btcAdress: merchantLNAddress || address, didWork: true, error: ''};
}

export {getClipboardText, getQRImage};
