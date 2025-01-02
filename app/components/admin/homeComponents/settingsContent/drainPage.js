import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import {
  BTN,
  COLORS,
  FONT,
  ICONS,
  SATSPERBITCOIN,
  SHADOWS,
  SIZES,
} from '../../../../constants';
import {useEffect, useRef, useState} from 'react';
import {
  // fetchFiatRates,
  fetchReverseSwapFees,
  maxReverseSwapAmount,
  sendOnchain,
} from '@breeztech/react-native-breez-sdk';
import {
  formatBalanceAmount,
  getLocalStorageItem,
  numberConverter,
} from '../../../../functions';
import {useGlobalContextProvider} from '../../../../../context-store/context';
import {useNavigation} from '@react-navigation/native';

export default function DrainPage() {
  const isInitialRender = useRef(true);
  const [wantsToDrain, setWantsToDrain] = useState(false);
  const {theme, nodeInformation, masterInfoObject, liquidNodeInformation} =
    useGlobalContextProvider();
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigation();
  const [bitcoinAddress, setBitcoinAddress] = useState('');
  const [drainInfo, setDrainInfo] = useState({
    maxDrainAmount: 0,
    fees: 0,
    pairHash: '',
    totalEstimatedFees: 0,
  });
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isInitialRender.current) {
      initPage();
      isInitialRender.current = false;
    }
    if (!wantsToDrain) return;
    Alert.alert('This function does not work yet', '', [
      {text: 'Ok', onPress: () => navigate.goBack()},
    ]);
    // createOnChainSwap();

    // Alert.alert('This function does not work yet', '', [
    //   {text: 'Ok', onPress: () => navigate.goBack()},
    // ]);

    // console.log('DRAINING WALLET');
  }, [wantsToDrain]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{flex: 1}}>
      <TouchableWithoutFeedback
        onPress={() => {
          Keyboard.dismiss();
        }}>
        <SafeAreaView style={{flex: 1}}>
          <View style={{flex: 1, alignItems: 'center'}}>
            <View style={styles.balanceContainer}>
              <Text
                style={[
                  styles.balanceDescription,
                  {
                    color: theme ? COLORS.darkModeText : COLORS.lightModeText,
                  },
                ]}>
                Current balance
              </Text>
              <Text
                style={[
                  styles.balanceNum,
                  {
                    color: theme ? COLORS.darkModeText : COLORS.lightModeText,
                  },
                ]}>
                {`${formatBalanceAmount(
                  numberConverter(
                    masterInfoObject.userBalanceDenomination === 'fiat'
                      ? (nodeInformation.userBalance,
                        liquidNodeInformation.userBalance) *
                          (nodeInformation.fiatStats.value / SATSPERBITCOIN)
                      : nodeInformation.userBalance +
                          liquidNodeInformation.userBalance,
                    masterInfoObject.userBalanceDenomination,
                    nodeInformation,
                    masterInfoObject.userBalanceDenomination === 'fiat' ? 2 : 0,
                  ),
                )}  ${
                  masterInfoObject.userBalanceDenomination === 'fiat'
                    ? nodeInformation.fiatStats.coin
                    : 'Sats'
                }`}
              </Text>
              {/* <Text
                style={[
                  styles.fiatBalanceNum,
                  {
                    color: theme ? COLORS.darkModeText : COLORS.lightModeText,
                  },
                ]}>
                = $
                {
                fiatRate != 0
                  ? Math.round(
                      nodeInformation.userBalance * (fiatRate / 100000000),
                    )
                  : '---'}{' '}
                usd
              </Text> */}
            </View>

            {isLoading ? (
              <View style={{flex: 1}}>
                <ActivityIndicator
                  size="large"
                  color={theme ? COLORS.darkModeText : COLORS.lightModeText}
                  style={{
                    marginTop: 'auto',
                    marginBottom: 'auto',
                  }}
                />
              </View>
            ) : (
              <>
                <View
                  style={[
                    styles.btcAdressContainer,
                    {
                      backgroundColor: theme
                        ? COLORS.darkModeBackgroundOffset
                        : COLORS.lightModeBackgroundOffset,
                      marginBottom: 'auto',
                    },
                  ]}>
                  <Text
                    style={[
                      styles.btcAdressHeader,
                      {
                        color: theme
                          ? COLORS.darkModeText
                          : COLORS.lightModeText,
                      },
                    ]}>
                    Enter BTC address
                  </Text>
                  <View style={[styles.inputContainer]}>
                    <TextInput
                      value={bitcoinAddress}
                      onChangeText={setBitcoinAddress}
                      style={[
                        styles.input,
                        {
                          borderColor: theme
                            ? COLORS.darkModeText
                            : COLORS.lightModeText,
                          color: theme
                            ? COLORS.darkModeText
                            : COLORS.lightModeText,
                        },
                      ]}
                    />
                    <TouchableOpacity
                      onPress={() => {
                        if (errorMessage) return;
                        navigate.navigate('CameraModal', {
                          updateBitcoinAdressFunc: setBitcoinAddress,
                        });
                      }}>
                      <Image
                        style={styles.scanIcon}
                        source={ICONS.faceIDIcon}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <View>
                  {errorMessage ? (
                    <Text style={styles.errorText}>{errorMessage}</Text>
                  ) : (
                    <>
                      <Text
                        style={[
                          styles.textBreakdown,
                          {
                            color: theme
                              ? COLORS.darkModeText
                              : COLORS.lightModeText,
                          },
                        ]}>{`Max sendable amount: ${drainInfo.maxDrainAmount.toLocaleString()}`}</Text>
                      <Text
                        style={[
                          styles.textBreakdown,
                          {
                            color: theme
                              ? COLORS.darkModeText
                              : COLORS.lightModeText,
                          },
                        ]}>{`Total estimated Fees: ${drainInfo.totalEstimatedFees.toLocaleString()}`}</Text>
                    </>
                  )}
                </View>

                <TouchableOpacity
                  onPress={() => {
                    if (!bitcoinAddress || errorMessage) return;
                    navigate.navigate('ConfirmActionPage', {
                      wantsToDrainFunc: setWantsToDrain,
                    });
                  }}
                  style={[
                    BTN,
                    {
                      backgroundColor: COLORS.primary,
                      opacity: !bitcoinAddress || errorMessage ? 0.5 : 1,
                      marginBottom: 15,
                    },
                  ]}>
                  <Text style={styles.buttonText}>Drain</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );

  async function initPage() {
    try {
      const maxDrainAmount = await maxReverseSwapAmount();
      const currentFees = await fetchReverseSwapFees({
        sendAmountSat: maxDrainAmount.totalSat,
      });

      console.log(currentFees, maxDrainAmount);
      const fees = await getMempoolTxFee();
      setDrainInfo({
        maxDrainAmount: maxDrainAmount.totalSat,
        fees: fees.halfHourFee,
        pairHash: currentFees.feesHash,
        totalEstimatedFees: currentFees.totalEstimatedFees,
      });
      setIsLoading(false);
    } catch (err) {
      if (String(err).toLowerCase().includes('send amount is too low')) {
        setIsLoading(false);
        setErrorMessage('Swap amount is too low');
      }
      console.log(err);
    }
  }

  async function createOnChainSwap() {
    const revereseSwapInfo = await sendOnchain({
      amountSat: drainInfo.maxDrainAmount,
      onchainRecipientAddress: bitcoinAddress,
      pairHash: drainInfo.pairHash,
      satPerVbyte: drainInfo.fees,
    });
  }
  async function getMempoolTxFee() {
    try {
      const data = await fetch('https://mempool.space/api/v1/fees/recommended');
      const info = await data.json();
      return new Promise(resolve => {
        resolve(info);
      });
    } catch (err) {
      setErrorMessage('Error getting transaction fee amount');
    }
  }
}

const styles = StyleSheet.create({
  globalContainer: {
    flex: 1,
    alignItems: 'center',
  },

  balanceContainer: {
    alignItems: 'center',
    marginTop: 25,
    marginBottom: 50,
  },
  balanceNum: {
    fontFamily: FONT.Title_Bold,
    fontSize: SIZES.xxLarge,
  },
  fiatBalanceNum: {
    fontFamily: FONT.Title_Regular,
    fontSize: SIZES.medium,
  },
  balanceDescription: {
    fontFamily: FONT.Descriptoin_Regular,
    fontSize: SIZES.medium,
    marginBottom: 10,
  },

  btcAdressContainer: {
    width: '90%',
    padding: 8,
    borderRadius: 8,
    backgroundColor: COLORS.offsetBackground,
  },
  btcAdressHeader: {
    fontFamily: FONT.Title_Regular,
    fontSize: SIZES.medium,
    marginBottom: 10,
  },

  inputContainer: {
    width: '100%',
    height: 35,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  input: {
    width: '80%',
    height: '100%',
    borderRadius: 8,
    borderWidth: 2,
    paddingHorizontal: 10,
  },
  scanIcon: {
    width: 35,
    height: 35,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: SIZES.medium,
    fontFamily: FONT.Other_Regular,
  },

  errorText: {
    fontFamily: FONT.Descriptoin_Regular,

    fontSize: SIZES.medium,
    color: COLORS.cancelRed,
  },

  textBreakdown: {
    fontFamily: FONT.Descriptoin_Regular,
    fontSize: SIZES.medium,
  },
});
