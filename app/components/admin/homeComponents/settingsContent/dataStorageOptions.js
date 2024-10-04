import {StyleSheet, Switch, Text, View} from 'react-native';
import {CENTER, COLORS, FONT, SIZES} from '../../../../constants';
import {useEffect, useRef, useState} from 'react';

import {useGlobalContextProvider} from '../../../../../context-store/context';

import {useNavigation} from '@react-navigation/native';
import {handleDataStorageSwitch} from '../../../../../db';
import {ThemeText} from '../../../../functions/CustomElements';

export default function DataStorageOptions() {
  const [isUsingBlitzStorage, setIsUsingBlitzStorage] = useState(null);
  const {theme, masterInfoObject, toggleMasterInfoObject} =
    useGlobalContextProvider();
  const navigate = useNavigation();

  const dataStorageSettings = masterInfoObject.usesLocalStorage;

  useEffect(() => {
    setIsUsingBlitzStorage(!dataStorageSettings);
  }, [dataStorageSettings]);

  return (
    <View style={{flex: 1}}>
      <View
        style={{
          backgroundColor: theme
            ? COLORS.darkModeBackgroundOffset
            : COLORS.lightModeBackgroundOffset,
          borderRadius: 8,
          marginTop: 20,
        }}>
        <View
          style={[
            styles.switchContainer,
            {
              borderBottomColor: theme
                ? COLORS.darkModeBackground
                : COLORS.lightModeBackground,
            },
          ]}>
          <View style={styles.switchTextContainer}>
            <ThemeText
              content={'Store data with blitz'}
              styles={{...styles.switchText}}
            />
            <Switch
              style={{marginRight: 10}}
              onChange={async event => {
                const didSwitch = await handleDataStorageSwitch(
                  event.nativeEvent.value,
                  toggleMasterInfoObject,
                );

                if (didSwitch)
                  setIsUsingBlitzStorage(prev => {
                    return !prev;
                  });
                else
                  navigate.navigate('ErrorScreen', {
                    errorMessage: 'Could not switch storage locations',
                  });
              }}
              value={isUsingBlitzStorage}
              trackColor={{false: '#767577', true: COLORS.primary}}
            />
          </View>
        </View>
        <View style={styles.warningContainer}>
          <ThemeText
            content={`By storing data with Blitz, you can retrieve all your data in the event of an emergency. Otherwise, if your app is deleted or you get a new phone locally stored data will not be recoverable.`}
            styles={{...styles.warningText}}
          />
          <ThemeText
            content={`All liquid swaps, added contacts, and chatGPT conversations are encripted using your private key.`}
            styles={{...styles.warningText, marginTop: 20}}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  switchContainer: {
    flexDirection: 'row',
    width: '95%',
    marginLeft: 'auto',
    borderBottomWidth: 1,
  },
  switchTextContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  switchText: {fontSize: SIZES.medium, fontFamily: FONT.Title_Regular},

  warningContainer: {
    width: '95%',
    marginLeft: 'auto',
    paddingVertical: 10,
  },
  warningText: {
    width: '90%',
    fontFamily: FONT.Title_Regular,
    fontSize: SIZES.medium,
  },

  recoveryText: {
    width: '95%',
    fontSize: SIZES.medium,
    fontFamily: FONT.Title_Regular,
    textAlign: 'center',
    marginVertical: 10,
    ...CENTER,
  },
});
