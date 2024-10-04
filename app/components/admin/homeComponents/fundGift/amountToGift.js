import {useNavigation, useTheme} from '@react-navigation/native';
import {
  Image,
  Keyboard,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';

import {
  BTN,
  CENTER,
  COLORS,
  FONT,
  ICONS,
  LNURL_WITHDRAWL_CODES,
  SHADOWS,
  SIZES,
} from '../../../../constants';
import {useGlobalContextProvider} from '../../../../../context-store/context';
import {useEffect, useRef, useState} from 'react';
import {copyToClipboard, formatBalanceAmount} from '../../../../functions';
import {getFiatRates} from '../../../../functions/SDK';
import {sendSpontaneousPayment} from '@breeztech/react-native-breez-sdk';
import {ConfigurePushNotifications} from '../../../../hooks/setNotifications';
import {getRandomBytes, randomUUID} from 'expo-crypto';
import * as bench32 from 'bech32';

import Buffer from 'buffer';
import QRCode from 'react-native-qrcode-svg';
import getKeyboardHeight from '../../../../hooks/getKeyboardHeight';
import {gdk, sendLiquidTransaction} from '../../../../functions/liquidWallet';
import generateGiftLiquidAddress from './generateLiquidAddress';
import {deriveKey, xorEncodeDecode} from './encodeDecode';
import {generateMnemonic} from '@dreson4/react-native-quick-bip39';
import {findDuplicates} from '../../../../functions/seed';

import {GlobalThemeView, ThemeText} from '../../../../functions/CustomElements';
import {backArrow} from '../../../../constants/styles';
import {WINDOWWIDTH} from '../../../../constants/theme';
import FullLoadingScreen from '../../../../functions/CustomElements/loadingScreen';
import CustomButton from '../../../../functions/CustomElements/button';
import CustomNumberKeyboard from '../../../../functions/CustomElements/customNumberKeyboard';

export default function AmountToGift() {
  const isInitialRender = useRef(true);
  const navigate = useNavigation();
  const {theme, nodeInformation, masterInfoObject, liquidNodeInformation} =
    useGlobalContextProvider();

  const acceptedSendRisk = useRef(false);

  const [giftAmount, setGiftAmount] = useState('');
  const [errorText, setErrorText] = useState('');
  const [giftContent, setGiftContent] = useState({
    code: '',
    content: '',
  });
  const [isLoading, setIsLoading] = useState('');
  const [loadingMessage, setLoadingMessage] = useState('');
  const windowWidth = useWindowDimensions().width;

  return (
    <GlobalThemeView>
      <View style={{flex: 1, width: WINDOWWIDTH, ...CENTER}}>
        <View style={styles.topbar}>
          <TouchableOpacity
            onPress={() => {
              Keyboard.dismiss();
              navigate.goBack();
            }}>
            <Image style={[backArrow]} source={ICONS.smallArrowLeft} />
          </TouchableOpacity>
          <ThemeText
            styles={{...styles.topBarText}}
            content={
              Object.entries(giftContent).filter(obj => {
                return !!obj[1];
              }).length > 1
                ? 'Claim Gift'
                : 'Set Gift Amount'
            }
          />
        </View>

        {isLoading ? (
          <FullLoadingScreen text={loadingMessage} />
        ) : Object.entries(giftContent).filter(obj => {
            return !!obj[1];
          }).length < 1 ? (
          <>
            <View style={[styles.contentContainer]}>
              <View style={[styles.inputContainer]}>
                <TextInput
                  readOnly={true}
                  style={[
                    styles.sendingAmtBTC,
                    {
                      color: theme ? COLORS.darkModeText : COLORS.lightModeText,
                      margin: 0,
                      padding: 0,
                      marginRight: 10,
                      includeFontPadding: false,
                    },
                  ]}
                  placeholderTextColor={
                    theme ? COLORS.darkModeText : COLORS.lightModeText
                  }
                  value={giftAmount}
                  keyboardType="numeric"
                  placeholder="0"
                  onChangeText={setGiftAmount}
                />

                <ThemeText
                  styles={{
                    fontSize: SIZES.xxLarge,
                    includeFontPadding: false,
                  }}
                  content={'sats'}
                />
              </View>
              <View>
                <Text
                  style={{
                    fontSize: SIZES.small,
                    fontFamily: FONT.Title_Regular,
                    color: theme ? COLORS.darkModeText : COLORS.lightModeText,
                  }}>
                  {(
                    Number(giftAmount) *
                    (nodeInformation.fiatStats.value / 100000000)
                  ).toFixed(2)}{' '}
                  {nodeInformation.fiatStats.coin}
                </Text>
              </View>
              <Text
                style={{
                  width: '95%',
                  fontFamily: FONT.Descriptoin_Regular,
                  color: COLORS.cancelRed,
                  marginTop: 20,
                  fontSize: SIZES.medium,
                  textAlign: 'center',
                }}>
                {errorText ? errorText : ' '}
              </Text>
            </View>
            <View>
              <Text
                style={{
                  fontFamily: FONT.Title_Regular,
                  fontSize: SIZES.medium,
                  color: theme ? COLORS.darkModeText : COLORS.lightModeText,
                  textAlign: 'center',
                  marginBottom: 10,
                }}>
                Minumum gift amount is {formatBalanceAmount(10000)} sats
              </Text>
            </View>
            <CustomButton
              buttonStyles={{width: '100%', marginTop: 10}}
              // textStyles={{textTransform: 'uppercase'}}
              actionFunction={createGiftCode}
              textContent={'Create Gift'}
            />

            {Object.entries(giftContent).filter(obj => {
              return !!obj[1];
            }).length < 1 && (
              <CustomNumberKeyboard
                showDot={false}
                frompage="giftWallet"
                setInputValue={setGiftAmount}
              />
            )}
          </>
        ) : (
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <ScrollView contentContainerStyle={{alignItems: 'center'}}>
              <View
                style={[
                  styles.qrCodeContainer,
                  {
                    backgroundColor: theme
                      ? COLORS.darkModeBackgroundOffset
                      : COLORS.lightModeBackgroundOffset,
                    paddingVertical: 10,
                    marginTop: 50,
                  },
                ]}>
                <QRCode
                  size={250}
                  quietZone={15}
                  value={
                    giftContent.content
                      ? giftContent.content
                      : 'Genrating QR Code'
                  }
                  color={theme ? COLORS.lightModeText : COLORS.darkModeText}
                  backgroundColor={
                    theme ? COLORS.darkModeText : COLORS.lightModeText
                  }
                />
              </View>

              <Text
                style={[
                  styles.giftAmountStyle,
                  {
                    color: theme ? COLORS.darkModeText : COLORS.lightModeText,
                    marginBottom: 10,
                  },
                ]}>
                {formatBalanceAmount(Number(giftAmount))} sats
              </Text>

              <View
                style={[
                  styles.giftAmountStyle,
                  {
                    color: theme ? COLORS.darkModeText : COLORS.lightModeText,
                    alignItems: 'center',
                  },
                ]}>
                <Text
                  style={[
                    styles.giftAmountStyle,
                    {
                      color: theme ? COLORS.darkModeText : COLORS.lightModeText,
                      marginBottom: 0,
                      marginTop: 0,
                    },
                  ]}>
                  Unlock Code:{' '}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    copyToClipboard(giftContent.code, navigate);
                  }}>
                  <Text
                    style={[
                      styles.giftAmountStyle,
                      {
                        color: theme
                          ? COLORS.darkModeText
                          : COLORS.lightModeText,
                        marginTop: 0,
                      },
                    ]}>
                    {giftContent.code}
                  </Text>
                </TouchableOpacity>
              </View>
              <View
                style={[
                  styles.giftAmountStyle,
                  {
                    color: theme ? COLORS.darkModeText : COLORS.lightModeText,
                    alignItems: 'center',
                  },
                ]}>
                <Text
                  style={[
                    styles.giftAmountStyle,
                    {
                      color: theme ? COLORS.darkModeText : COLORS.lightModeText,
                      marginBottom: 0,
                      marginTop: 0,
                    },
                  ]}>
                  Unlock Content:{' '}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    copyToClipboard(giftContent.content, navigate);
                  }}>
                  <Text
                    style={[
                      styles.giftAmountStyle,
                      {
                        color: theme
                          ? COLORS.darkModeText
                          : COLORS.lightModeText,
                        marginTop: 0,
                        width: windowWidth * 0.95,
                        flexWrap: 'wrap',
                        textAlign: 'center',
                      },
                    ]}>
                    {giftContent.content}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.buttonsContainer}>
                <CustomButton
                  buttonStyles={{marginRight: 10}}
                  actionFunction={() => openShareOptions(giftContent.content)}
                  textContent={'Share'}
                />
                <CustomButton
                  actionFunction={() =>
                    copyToClipboard(giftContent.content, navigate)
                  }
                  textContent={'Copy'}
                />
              </View>
            </ScrollView>
          </View>
        )}
      </View>
    </GlobalThemeView>
  );

  function createGiftCode() {
    try {
      if (giftAmount < 10000) {
        navigate.navigate('ErrorScreen', {
          errorMessage: 'Gift amount must be heigher than 10 000 sats',
        });
        return;
      } else if (
        nodeInformation.userBalance + 50 <= giftAmount &&
        liquidNodeInformation.userBalance + 50 <= giftAmount
      ) {
        navigate.navigate('ErrorScreen', {
          errorMessage: 'Not enough funds',
        });

        return;
      } else if (!acceptedSendRisk.current) {
        navigate.navigate('giftWalletConfirmation', {
          didConfirm: acceptedSendRisk,
          createGiftCode: createGiftCode,
        });
        return;
      }

      setIsLoading(true);
      setErrorText('');
      setLoadingMessage('Generating new seedphrase');

      generateGiftCode(giftAmount);
    } catch (err) {
      setErrorText('Error when sending payment');
      console.log(err);
    }
  }

  function createGiftCardCode() {
    const randomNumArray = getRandomBytes(32);
    const randomNumArrayLen = randomNumArray.length;
    const randomPosition = Math.floor(Math.random() * (randomNumArrayLen - 16));

    const unformattedUUID = randomNumArray
      .join('')
      .substring(randomPosition, randomPosition + 16);

    let UUID = ``;
    for (let index = 0; index < unformattedUUID.length; index++) {
      if (index % 4 === 0 && index != 0) UUID += '-';
      UUID += unformattedUUID[index];
    }

    return UUID;
  }

  function createValidMnemonic() {
    let mnemoinc = '';
    let isValidMnemoinc = false;
    let generations = 0;

    while (!isValidMnemoinc && generations < 10) {
      const generatedMnemonic = generateMnemnoic();
      const validated = gdk.validateMnemonic(mnemoinc);

      mnemoinc = generatedMnemonic;
      isValidMnemoinc = validated;
      generations += 1;
      console.log('RUNNING');
    }

    if (isValidMnemoinc && generations < 10) return mnemoinc;
    else return false;
  }

  async function createEncripedMessage(mnemoinc, UUID) {
    setLoadingMessage('Encrypting message');
    // const salt = (await generateSecureRandom(32)).toString('hex'); // In a real scenario, use a securely generated salt
    // const iterations = 500;
    // const keyLength = 32;

    // Derive the key asynchronously
    // const derivedKey = await deriveKey(UUID, salt, iterations, keyLength);

    const encryptedText = xorEncodeDecode(mnemoinc, UUID);
    // const decryptedText = xorEncodeDecode(encryptedText, derivedKey);

    return {
      // derivedKey,
      encryptedText,
    };
  }

  async function generateGiftCode(giftAmount) {
    try {
      const UUID = createGiftCardCode();

      const mnemoinc = createValidMnemonic();
      if (mnemoinc) {
        const liquidAddress = await generateGiftLiquidAddress(mnemoinc);

        const {encryptedText} = await createEncripedMessage(mnemoinc, UUID);
        console.log(encryptedText);
        console.log(liquidAddress);

        if (liquidAddress && encryptedText) {
          setLoadingMessage('Sending gift');
          const didSend = await sendLiquidTransaction(
            Number(giftAmount),
            liquidAddress,
          );

          if (didSend) {
            setGiftContent({code: UUID, content: encryptedText});
            setIsLoading(false);
          } else {
            setErrorText('Error sending gift');
          }
        } else {
          setErrorText('Error generating claim code');
        }

        console.log('DID RUN ');
      } else {
        setErrorText('Error generating new seedphrase');
      }

      return;

      // const data = `https://blitz-wallet.com/.netlify/functions/lnurlwithdrawl?platform=${
      //   Platform.OS
      // }&token=${expoPushToken?.data}&amount=${giftAmount}&uuid=${UUID}&desc=${
      //   LNURL_WITHDRAWL_CODES[0]
      // }&totalAmount=${1}`;

      // const byteArr = Buffer.Buffer.from(data, 'utf8');

      // const words = bench32.bech32.toWords(byteArr);

      // const encoded = bench32.bech32.encode('lnurl', words, 1500);

      // const withdrawLNURL = encoded.toUpperCase();

      // return withdrawLNURL;
    } catch (err) {
      return false;
      console.log(err);
    }
  }
}
async function openShareOptions(giftContent) {
  try {
    await Share.share({
      title: 'Receive Faucet Address',
      message: giftContent,
    });
  } catch {
    window.alert('ERROR with sharing');
  }
}

function generateMnemnoic() {
  // Generate a random 32-byte entropy
  try {
    let validMnemonic = '';
    for (let index = 0; index < 5; index++) {
      const generatedMnemonic = generateMnemonic()
        .split(' ')
        .filter(word => word.length > 2)
        .join(' ');

      if (findDuplicates(generatedMnemonic)) continue;

      validMnemonic = generatedMnemonic;
      break;
    }

    return validMnemonic;
  } catch (err) {
    console.log(err);
    return false;
  }
}
const styles = StyleSheet.create({
  globalContainer: {
    flex: 1,
  },

  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topBarIcon: {
    width: 25,
    height: 25,
  },
  topBarText: {
    fontSize: SIZES.large,
    // marginRight: 'auto',
    marginLeft: 'auto',
    // transform: [{translateX: -12.5}],
    fontFamily: FONT.Title_Bold,
  },
  contentContainer: {
    flex: 1,

    alignItems: 'center',
    justifyContent: 'center',
  },
  contentItem: {
    width: '90%',
    marginVertical: 10,
  },
  contentHeader: {
    fontFamily: FONT.Title_Bold,
    fontSize: SIZES.medium,
    marginBottom: 10,
  },
  contentDescriptionContainer: {
    padding: 10,
    borderRadius: 8,
  },
  contentDescription: {
    fontFamily: FONT.Descriptoin_Regular,
    fontSize: SIZES.medium,
    marginBottom: 10,
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  sendingAmtBTC: {
    fontSize: SIZES.xxLarge,
    fontFamily: FONT.Title_Regular,
  },

  satText: {
    // fontSize: SIZES.large,
    // fontFamily: FONT.Title_Regular,
    // color: COLORS.primary,
    // marginLeft: 10,
    marginTop: 'auto',
  },

  buttonText: {
    color: COLORS.white,
    fontFamily: FONT.Other_Regular,
  },

  qrCodeContainer: {
    width: 275,
    height: 'auto',
    minHeight: 275,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  giftAmountStyle: {
    marginBottom: 'auto',
    fontFamily: FONT.Title_Regular,
    fontSize: SIZES.large,
    marginTop: 10,
  },

  button: {
    width: 150,
    height: 35,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    marginTop: 50,
  },

  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 60,
    ...CENTER,
  },

  buttonsOpacity: {
    height: '100%',
    width: 100,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    // overflow: "hidden",
    ...SHADOWS.medium,
  },
  buttonText: {
    fontFamily: FONT.Other_Regular,
    fontSize: SIZES.medium,
    color: COLORS.background,
  },
});
