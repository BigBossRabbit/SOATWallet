import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  View,
  Button,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  Image,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import Voice from '@react-native-voice/voice';
import {useGlobalContextProvider} from '../../../../../../../../context-store/context';
import {
  CENTER,
  CHATGPT_INPUT_COST,
  CHATGPT_OUTPUT_COST,
  COLORS,
  ICONS,
  SATSPERBITCOIN,
} from '../../../../../../../constants';
import {ThemeText} from '../../../../../../../functions/CustomElements';
import Icon from '../../../../../../../functions/CustomElements/Icon';
import {useNavigation} from '@react-navigation/native';
import AudioBars from '../chatGPTSpeaking';
import axios from 'axios';
import {useGlobalAppData} from '../../../../../../../../context-store/appData';
import GetThemeColors from '../../../../../../../hooks/themeColors';

const UserSpeaking = ({totalAvailableCredits}) => {
  const {JWT, nodeInformation, darkModeType} = useGlobalContextProvider();

  console.log(darkModeType, 'TESTING');
  const {toggleGlobalAppDataInformation, globalAppDataInformation} =
    useGlobalAppData();
  const lastResultTime = useRef(null);
  const timeoutRef = useRef(null);
  const cancelRef = useRef(null);
  const windowDimensions = useWindowDimensions();
  const [isUserSpeaking, setIsUserSpeaking] = useState(true);
  const [isGettingResponse, setIsGettingResponse] = useState(false);
  const [isPlayingResponse, setIsPlayingResponse] = useState(false);
  const [isChatGPTPaused, setIsChatGPTPaused] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [chatGPTResponse, setChatGPTResponse] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const scale = useSharedValue(1);
  const navigate = useNavigation();
  const {textColor, backgroundOffset, backgroundColor} = GetThemeColors();

  const chatGPTConversations = globalAppDataInformation?.chatGPT?.conversation;
  const bitconFiatValue = nodeInformation?.fiatStats?.value;

  const handleSpeechResults = event => {
    setUserInput(event.value[0]);
  };

  useEffect(() => {
    if (!userInput || !userInput.trim()) return;
    const currentTime = Date.now();

    if (lastResultTime.current) {
      const timeSinceLastResult = currentTime - lastResultTime.current;

      console.log(timeSinceLastResult);
      if (timeSinceLastResult > 3000) {
        console.log('More than a second delay since the last speech result');
      }
    }

    // Reset the timer
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(event => {
      console.log('RUNNING', userInput);
      submitChaMessage();
    }, 3000);

    lastResultTime.current = currentTime;
  }, [userInput, submitChaMessage]);

  useEffect(() => {
    Voice.onSpeechVolumeChanged = event => {
      const volume = event.value;
      // Use the volume level to scale the circle
      scale.value = withSpring(1 + volume * 0.1); // Adjust the multiplier for more/less sensitivity
    };
    Voice.onSpeechResults = handleSpeechResults;

    startListening();
    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
      cancelRef.current = true;
    };
  }, [scale]);

  const startListening = async () => {
    setIsUserSpeaking(true);
    setIsGettingResponse(false);
    setIsPlayingResponse(false);
    setIsChatGPTPaused(false);

    try {
      await Voice.start('en-US');
    } catch (e) {
      console.error(e);
    }
  };

  const stopListening = async from => {
    if (from != 'homepage') setIsUserSpeaking(false);
    else setIsChatGPTPaused(true);
    try {
      await Voice.stop();
    } catch (e) {
      console.error(e);
    }
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{scale: scale.value}],
    };
  });

  const submitChaMessage = useCallback(() => {
    if (userInput.length === 0 || userInput.trim() === '') return;

    if (totalAvailableCredits < 30) {
      navigate.goBack();
      navigate.navigate('AddChatGPTCredits', {navigation: navigate});
      return;
    }
    // cancelRef.current = false;
    setIsUserSpeaking(false);
    setIsGettingResponse(true);
    stopListening();

    let userChatObject = {};

    userChatObject['content'] = userInput;
    userChatObject['role'] = 'user';

    setChatHistory(prev => [...prev, userChatObject]);

    getChatResponse(userChatObject);
  }, [
    setIsUserSpeaking,
    setIsGettingResponse,
    stopListening,
    setChatHistory,
    getChatResponse,
    navigate,
    totalAvailableCredits,
    userInput,
  ]);

  const getChatResponse = useCallback(
    async userChatObject => {
      try {
        let tempAmount = totalAvailableCredits;
        let tempArr = [...chatHistory];
        tempArr.push(userChatObject);

        const response = await axios.post(
          process.env.GPT_URL,
          JSON.stringify({messages: tempArr}),
          {
            headers: {
              Authorization: `${JWT}`,
            },
          },
        );

        if (response.status === 200) {
          // calculate price
          const data = response.data;
          const [textInfo] = data.choices;
          // const inputPrice = 0.5 / 1000000;
          // const outputPrice = 0.5 / 1000000;
          const satsPerDollar = SATSPERBITCOIN / (bitconFiatValue || 60000);

          const price =
            CHATGPT_INPUT_COST * data.usage.prompt_tokens +
            CHATGPT_OUTPUT_COST * data.usage.completion_tokens;

          const apiCallCost = price * satsPerDollar; //sats

          const blitzCost = Math.ceil(
            apiCallCost + 20 + Math.ceil(apiCallCost * 0.005),
          );
          tempAmount -= blitzCost;
          toggleGlobalAppDataInformation(
            {
              chatGPT: {
                conversation: chatGPTConversations,
                credits: tempAmount,
              },
            },
            true,
          );
          setUserInput('');
          if (cancelRef.current) {
            cancelRef.current = false;
            return;
          }

          setChatGPTResponse(textInfo.message.content);

          setChatHistory(prev => {
            let tempArr = [...prev];

            tempArr.push({
              content: textInfo.message.content,
              role: textInfo.message.role,
            });
            return tempArr;
          });

          setIsGettingResponse(false);
          setIsPlayingResponse(true);
        } else throw new Error('Not able to get response');
      } catch (err) {
        navigate.navigate('ErrorScreen', {
          errorMessage: 'Not able to get response',
        });

        console.log(err, 'ERR');
      }
    },
    [
      toggleGlobalAppDataInformation,
      setUserInput,
      setChatHistory,
      setChatGPTResponse,
      setIsGettingResponse,
      setIsPlayingResponse,
      JWT,
      chatHistory,
      navigate,
      totalAvailableCredits,
      chatGPTConversations,
      bitconFiatValue,
    ],
  );

  return (
    <View style={{flex: 1}}>
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <TouchableOpacity
          onPress={() => {
            if (isGettingResponse) return;
            if (isUserSpeaking && !isChatGPTPaused && !userInput) {
              stopListening('homepage');
              return;
            }
            if (isChatGPTPaused && (!isGettingResponse || !isPlayingResponse)) {
              startListening();
              cancelRef.current = true;
              setIsChatGPTPaused(false);
              return;
            }
            setIsUserSpeaking(prev => {
              if (!prev) {
                setIsGettingResponse(false);
                setIsPlayingResponse(false);
                cancelRef.current = true;
                startListening();
                return true;
              } else {
                clearTimeout(timeoutRef.current);
                stopListening();
                submitChaMessage();
                return false;
              }
            });
          }}>
          {isUserSpeaking && (
            <Animated.View
              style={[
                {
                  width: windowDimensions.width / 3,
                  height: windowDimensions.width / 3,
                  borderRadius: windowDimensions.width / 2,
                  backgroundColor: COLORS.darkModeText,
                },
                animatedStyle,
              ]}
            />
          )}
          <AudioBars
            startListening={startListening}
            isGettingResponse={isGettingResponse}
            isPlayingResponse={isPlayingResponse}
            isUserSpeaking={isUserSpeaking}
            setIsUserSpeaking={setIsUserSpeaking}
            setIsPlayingResponse={setIsPlayingResponse}
            userInput={userInput}
            chatGPTResponse={chatGPTResponse}
          />
        </TouchableOpacity>
        <ThemeText
          styles={{color: COLORS.darkModeText, marginTop: 90}}
          content={
            !isUserSpeaking && !isGettingResponse && !isPlayingResponse
              ? 'Start speaking'
              : isUserSpeaking
              ? isChatGPTPaused
                ? 'Tap to Speak'
                : 'Listening'
              : isPlayingResponse
              ? 'Tap to inturrupt'
              : 'Getting Response'
          }
        />
      </View>

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          width: '80%',
          ...CENTER,
        }}>
        <TouchableOpacity
          style={{
            width: 70,
            height: 70,
            backgroundColor: darkModeType
              ? COLORS.lightModeBackgroundOffset
              : COLORS.darkModeText,
            borderRadius: 50,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onPress={() => {
            cancelRef.current = true;
            if (isGettingResponse || isPlayingResponse) return;
            if (isChatGPTPaused) {
              startListening();
            } else {
              stopListening('homepage');
            }
          }}>
          <Icon
            width={35}
            height={35}
            color={
              darkModeType
                ? COLORS.lightsOutBackground
                : COLORS.darkModeBackground
            }
            name={isChatGPTPaused ? 'playIcon' : 'pauseIcon'}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={navigate.goBack}
          style={{
            backgroundColor: darkModeType
              ? COLORS.lightsOutBackground
              : COLORS.darkModeBackground,
            borderRadius: 50,
          }}>
          <Icon height={70} width={70} name={'cancelIcon'} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default UserSpeaking;
