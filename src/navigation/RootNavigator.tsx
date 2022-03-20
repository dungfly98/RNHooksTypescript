import React, { useContext, useEffect } from 'react';
import { StatusBar, StatusBarStyle } from 'react-native';

import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { connect, ConnectedProps } from 'react-redux';

import { AppState, AppDispatch } from 'store';
import { changeStatusAuthenticate } from 'store/actions';

import { ThemeContext } from 'resources/theme';

import { Storage } from 'utilities';
import { AuthenticateAPI } from 'services';

import AuthenticateNavigator from './AuthenticateNavigator';
import MainNavigator from './MainNavigator';

import {
  NAVIGATION_MAIN,
  NAVIGATION_AUTHEN,
  type RootStackList,
} from './routes';

const NativeStack = createNativeStackNavigator<RootStackList>();

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface RootNavigatorProps extends PropsFromRedux {}

/**
 * If you need to add normal Navigatior, add it in Root
 */
const RootNavigator: React.FC<RootNavigatorProps> = (props) => {
  const { isLogged, refreshTokenFailure } = props;
  const { theme } = useContext(ThemeContext);

  useEffect(() => {
    if (isLogged) {
      const refreshToken = async () => {
        const data = await Storage.getToken();
        if (data !== undefined) {
          const res = await AuthenticateAPI.refreshToken(data.refreshToken);
          if (res.data.status === 0) {
            await Storage.setToken(
              res.data.data?.accessToken,
              res.data.data?.refreshToken
            );
          } else {
            await Storage.removeToken();
            refreshTokenFailure();
          }
        }
      };
      refreshToken().catch(async () => {
        await Storage.removeToken();
        refreshTokenFailure();
      });
    }
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={theme.navigationbar.barStyle as StatusBarStyle} />
      <NavigationContainer>
        <NativeStack.Navigator screenOptions={{ headerShown: false }}>
          {isLogged ? (
            <NativeStack.Screen
              name={NAVIGATION_MAIN}
              component={MainNavigator}
            />
          ) : (
            <NativeStack.Screen
              name={NAVIGATION_AUTHEN}
              component={AuthenticateNavigator}
            />
          )}
        </NativeStack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

const mapStateToProps = (state: AppState) => ({
  isLogged: state.authenticate.status,
});

const mapDispatchToProps = (dispatch: AppDispatch) => ({
  refreshTokenFailure: () => {
    dispatch(changeStatusAuthenticate(false));
  },
});

const connector = connect(mapStateToProps, mapDispatchToProps);
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(RootNavigator);
