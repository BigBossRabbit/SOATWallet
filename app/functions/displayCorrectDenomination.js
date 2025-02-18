import {BITCOIN_SATS_ICON} from '../constants';
import {formatCurrency} from './formatCurrency';
import formatBalanceAmount from './formatNumber';
import numberConverter from './numberConverter';

export default function displayCorrectDenomination({
  amount,
  nodeInformation,
  masterInfoObject,
}) {
  try {
    const convertedAmount = numberConverter(
      amount,
      masterInfoObject.userBalanceDenomination,
      nodeInformation,
      masterInfoObject.userBalanceDenomination === 'fiat' ? 2 : 0,
    );
    const currencyText = nodeInformation?.fiatStats.coin || 'USD';
    const showSymbol = masterInfoObject.satDisplay === 'symbol';
    const showSats =
      masterInfoObject.userBalanceDenomination === 'sats' ||
      masterInfoObject.userBalanceDenomination === 'hidden';

    const formattedCurrency = formatCurrency({
      amount: convertedAmount,
      code: currencyText,
    });
    const isSymbolInFront = formattedCurrency[3];
    const currencySymbol = formattedCurrency[2];
    const formatedSat = `${formatBalanceAmount(convertedAmount)}`;

    if (showSats) {
      if (showSymbol) return BITCOIN_SATS_ICON + formatedSat;
      else formatedSat + ' sats';
    } else {
      if (showSymbol && isSymbolInFront) return currencySymbol + formatedSat;
      else if (showSymbol && !isSymbolInFront)
        return formatedSat + currencySymbol;
      else return formatedSat + ` ${currencyText}`;
    }
  } catch (err) {
    console.log('display correct denomincation error', err);
    return '';
  }
}
