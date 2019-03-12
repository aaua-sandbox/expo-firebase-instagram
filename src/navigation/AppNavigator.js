import { createStackNavigator, NavigationActions } from 'react-navigation';

/* screen */
import MainTabNavigator from 'app/src/navigation/MainTabNavigator';
import UserScreen from 'app/src/screens/UserScreen';
import TagScreen from 'app/src/screens/TagScreen';
import PostScreen from 'app/src/screens/PostScreen';
import TakeScreen from 'app/src/screens/TakeScreen';
import TakePublishScreen from 'app/src/screens/TakePublishScreen';

/* from app */
import IconButton from 'app/src/components/IconButton';

// 撮影・メディアの選択から投稿までのスクリーンを持つStackNavigator
const TakeStack = createStackNavigator(
  {
    Take: { screen: TakeScreen },
    TakePublish: { screen: TakePublishScreen },
  },
  {
    headerMode: 'screen',
  },
);

// メインのTabNavigatorとユーザー詳細・タグ検索画面・投稿詳細スクリーンを持つStackNavigator
const CardNavigator = createStackNavigator(
  {
    Main: { screen: MainTabNavigator, navigationOptions: { header: null } },
    User: { screen: UserScreen },
    Tag: { screen: TagScreen },
    Post: { screen: PostScreen },
  },
  {
    navigationOptions: () => ({
      headerTitleStyle: {
        color: '#333',
      },
      headerLeft: IconButton,
    }),
  },
);

// StackNavigatorの統合
const AppNavigator = createStackNavigator(
  {
    MainStack: {
      screen: CardNavigator,
      navigationOptions: {
        header: null,
      },
    },
    TakeModal: {
      screen: TakeStack,
    },
  },
  {
    // TakeStackへの遷移はモーダルモード
    mode: 'modal',
    headerMode: 'none',
    navigationOptions: () => ({
      headerTitleStyle: {
        color: '#333',
      },
    }),
  },
);

// 同じスクリーンから同じスクリーンに遷移する事を避けるようにする
const navigateOnce = getStateForAction => (action, state) => {
  const { type, routeName } = action;

  if (state && type === NavigationActions.NAVIGATE) {
    // 直前のrouteNameと遷移先のrouteNameが同じであれば遷移を無効化する
    if (routeName === state.routes[state.routes.length - 1].routeName) {
      return null;
    }
  }

  return getStateForAction(action, state);
};

// アクティブになっているrouteNameを取得
export const getActiveRouteName = (navigationState) => {
  if (!navigationState) {
    return null;
  }

  // アクティブな子routeを取得
  const route = navigationState.routes[navigationState.index];

  // 子routesがあれば再帰的に呼び出す
  if (route.routes) {
    return getActiveRouteName(route);
  }

  return route.routeName;
};

// navigateOnceを設定する事でルーティング時にStoreのStateを取得するようになる
AppNavigator.router.getStateForAction = navigateOnce(AppNavigator.router.getStateForAction);


export default AppNavigator;
