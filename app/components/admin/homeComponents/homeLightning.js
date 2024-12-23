import {StyleSheet, View} from 'react-native';
import {UserSatAmount} from './homeLightning/userSatAmount';
import {SendRecieveBTNs} from './homeLightning/sendReciveBTNs';
import LiquidityIndicator from './homeLightning/liquidityIndicator';
import {useGlobalContextProvider} from '../../../../context-store/context';
import {GlobalThemeView, ThemeText} from '../../../functions/CustomElements';
import CustomFlatList from './homeLightning/cusomFlatlist/CustomFlatList';
import getFormattedHomepageTxs from '../../../functions/combinedTransactions';
import NavBar from './navBar';
import {useNavigation} from '@react-navigation/native';
import {useUpdateHomepageTransactions} from '../../../hooks/updateHomepageTransactions';
import {useGlobaleCash} from '../../../../context-store/eCash';
import {useEffect, useMemo} from 'react';
import {useTranslation} from 'react-i18next';
import {useWebView} from '../../../../context-store/webViewContext';
export default function HomeLightning({tabNavigation}) {
  console.log('HOME LIGHTNING PAGE');
  const {
    nodeInformation,
    masterInfoObject,
    liquidNodeInformation,
    theme,
    setDidGetToHomePage,
  } = useGlobalContextProvider();
  const {ecashTransactions} = useGlobaleCash();
  const navigate = useNavigation();
  const shouldUpdateTransactions = useUpdateHomepageTransactions();
  // const {autoChannelRebalanceIDs} = useWebView();
  const {t} = useTranslation();

  const showAmount = masterInfoObject.userBalanceDenomination;
  const masterFailedTransactions = masterInfoObject.failedTransactions;
  const enabledEcash = masterInfoObject.enabledEcash;
  const homepageTxPreferance = masterInfoObject.homepageTxPreferance;

  useEffect(() => {
    setDidGetToHomePage(true);
  }, [setDidGetToHomePage]);

  const flatListData = useMemo(() => {
    return getFormattedHomepageTxs({
      nodeInformation,
      liquidNodeInformation,
      masterInfoObject,
      theme,
      navigate,
      showAmount: showAmount != 'hidden',
      frompage: 'home',
      ecashTransactions,
      viewAllTxText: t('wallet.see_all_txs'),
      noTransactionHistoryText: t('wallet.no_transaction_history'),
      todayText: t('constants.today'),
      yesterdayText: t('constants.yesterday'),
      dayText: t('constants.day'),
      monthText: t('constants.month'),
      yearText: t('constants.year'),
      agoText: t('transactionLabelText.ago'),
      // autoChannelRebalanceIDs: autoChannelRebalanceIDs,
    });
  }, [
    ecashTransactions,
    nodeInformation,
    liquidNodeInformation,
    masterFailedTransactions,
    showAmount,
    theme,
    enabledEcash,
    homepageTxPreferance,
    shouldUpdateTransactions,
    navigate,
    // autoChannelRebalanceIDs,
  ]);

  return (
    <GlobalThemeView styles={{paddingBottom: 0, paddintTop: 0}}>
      <CustomFlatList
        style={{overflow: 'hidden', flex: 1}}
        data={flatListData} // check this
        renderItem={({item}) => item}
        HeaderComponent={<NavBar />}
        StickyElementComponent={
          <GlobalThemeView
            styles={{paddingTop: 0, paddingBottom: 10, alignItems: 'center'}}>
            <ThemeText
              content={t('constants.total_balance')}
              styles={{
                textTransform: 'uppercase',
                marginTop: nodeInformation.userBalance === 0 ? 20 : 0,
              }}
            />
            <UserSatAmount />
            {/* {nodeInformation.userBalance != 0 && <LiquidityIndicator />} */}
          </GlobalThemeView>
        }
        TopListElementComponent={
          <View
            style={{
              alignItems: 'center',
            }}>
            <SendRecieveBTNs tabNavigation={tabNavigation} />
            {/* <ThemeText
              content={'Transactions'}
              styles={{
                paddingBottom: 5,
              }}
            /> */}
          </View>
        }
      />
    </GlobalThemeView>
    // <View style={style.globalContainer}>
    //   <ThemeText
    //     content={'Total Balance'}
    //     styles={{
    //       textTransform: 'uppercase',
    //       marginTop: 30,
    //     }}
    //   />
    //   <UserSatAmount />
    //   <LiquidityIndicator />
    //   <SendRecieveBTNs />
    //   <ThemeText
    //     content={'Transactions'}
    //     styles={{
    //       paddingBottom: 5,
    //     }}
    //   />
    //   {/* <View style={{flex: 1, width: '100%'}}> */}
    //   {/* <View
    //       style={[
    //         style.shadowContainer,
    //         {
    //           backgroundColor: theme
    //             ? COLORS.darkModeBackground
    //             : COLORS.lightModeBackground,

    //           // shadowColor: theme
    //           //   ? COLORS.darkModeBackground
    //           //   : COLORS.lightModeBackground,
    //         },
    //       ]}
    //       ></View> */}
    //   <UserTransactions from="homepage" />
    //   {/* </View> */}
    // </View>
  );
}

const style = StyleSheet.create({
  globalContainer: {
    flex: 1,
    alignItems: 'center',
  },

  shadowContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 10,

    opacity: 0.7,

    shadowOffset: {height: 8, width: 0},

    shadowOpacity: 1,
    elevation: 2,
    zIndex: 1,
  },
});
