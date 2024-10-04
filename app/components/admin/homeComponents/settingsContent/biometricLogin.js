import {Alert, StyleSheet, Switch, Text, View} from 'react-native';
import {COLORS, FONT, SIZES} from '../../../../constants';
import {useEffect, useState} from 'react';

import {useNavigation} from '@react-navigation/native';
import {handleLogin, hasHardware, hasSavedProfile} from '../../../../functions';
import {useGlobalContextProvider} from '../../../../../context-store/context';
import {ThemeText} from '../../../../functions/CustomElements';
import GetThemeColors from '../../../../hooks/themeColors';
import FullLoadingScreen from '../../../../functions/CustomElements/loadingScreen';

export default function BiometricLoginPage() {
  const [isFaceIDEnabled, setIsFaceIDEnabled] = useState(null);
  const navigate = useNavigation();
  const {masterInfoObject, toggleMasterInfoObject} = useGlobalContextProvider();
  const {backgroundOffset} = GetThemeColors();

  const faceIDPreferance = masterInfoObject.userFaceIDPereferance;

  useEffect(() => {
    (async () => {
      const canUseFaceID = await hasHardware();

      if (canUseFaceID) {
        const hasProfile = await hasSavedProfile();

        if (hasProfile) {
          setIsFaceIDEnabled(faceIDPreferance);
        } else {
          Alert.alert(
            'Device does not have a Biometric profile',
            'Create one in settings to continue',
            [{text: 'Ok', onPress: () => navigate.goBack()}],
          );
        }
      } else {
        Alert.alert('Device does not support Biometric login', '', [
          {text: 'Ok', onPress: () => navigate.goBack()},
        ]);
      }
    })();
  }, [faceIDPreferance]);

  if (isFaceIDEnabled === null) {
    return <FullLoadingScreen text={'Getting biometric settigns'} />;
  }
  return (
    <View style={styles.globalContainer}>
      <View style={styles.innerContainer}>
        <View
          style={[
            styles.contentContainer,
            {
              backgroundColor: backgroundOffset,
            },
          ]}>
          <View style={styles.faceIDContainer}>
            <ThemeText
              styles={{...styles.contentText}}
              content={' Enable Biometric Login'}
            />
            <Switch
              trackColor={{
                true: COLORS.primary,
              }}
              onChange={handleSwitch}
              value={isFaceIDEnabled}
            />
          </View>
        </View>
      </View>
    </View>
  );
  async function handleSwitch() {
    const didLogin = await handleLogin();

    if (didLogin) {
      setIsFaceIDEnabled(prev => !prev);

      toggleMasterInfoObject({userFaceIDPereferance: !isFaceIDEnabled});
    } else {
      Alert.alert('Error, Try again.');
    }
  }
}

const styles = StyleSheet.create({
  globalContainer: {
    flex: 1,
    alignItems: 'center',
  },
  innerContainer: {
    flex: 1,
    width: '90%',
    paddingTop: 50,
  },
  contentContainer: {
    width: '100%',
    padding: 10,
    borderRadius: 8,
  },
  contentText: {
    fontSize: SIZES.medium,
  },

  faceIDContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sliderContainer: {
    width: 70,
    height: 35,
    backgroundColor: COLORS.primary,
    borderRadius: 50,
    justifyContent: 'center',
  },
  sliderBall: {
    height: 30,
    width: 30,
    borderRadius: 15,
    position: 'absolute',
    left: 0,
  },
});
