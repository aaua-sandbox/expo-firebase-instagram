import { Constants }  from 'expo';
import { createStackNavigator } from 'react-navigation';
import { createBottomTabNavigator } from 'react-navigation-tabs';

/* from app */
import HomeScreen from 'app/src/screens/HomeScreen';
import SearchScreen from 'app/src/screens/SearchScreen';
import NotificationScreen from 'app/src/screens/NotificationScreen';
import UserScreen from 'app/src/screens/UserScreen';
import {
  HomeTabIcon,
  SearchTabIcon,
  TakeTabIcon,
  NotificationTabIcon,
  MeTabIcon,
  TabBar,
} from 'app/src/components/Tab';
import {Use} from "expo/build/Svg.web";

// StackNavigator を簡単に作れるようにするための関数
const createTabStack = (title, screen) => createStackNavigator({
  [title]: {screen},
});

// メインのBottomTabNavigator
export default createBottomTabNavigator(
  {
    // ホームタブ
    HomeTab: {
      // 表示するスクリーン
      screen: createTabStack('HomeTab', HomeScreen),
      navigationOptions: () => ({
        tabBarIcon: HomeTabIcon, // アイコン
      }),
    },

    SearchTab: {
      screen: createTabStack('SearchTab', SearchScreen),
      navigationOptions: () => ({
        tabBarIcon: SearchTabIcon,
      }),
    },

    TakeTab: {
      screen: () => null,
      navigationOptions: ({ navigation }) => ({
        tabBarIcon: TakeTabIcon,
        tabBarOnPress: () => {
          navigation.push('TakeModal');
        },
      }),
    },

    NotificationTab: {
      screen: createTabStack('NotificationTab', NotificationScreen),
        navigationOptions: () => ({
        tabBarIcon: NotificationTabIcon,
      }),
    },

    MeTab: {
      screen: createTabStack('MeTab', UserScreen),
      navigationOptions: () => ({
        tabBarIcon: MeTabIcon,
      }),
    },
  },

  // タブナビゲーション全体の設定
  {
    tabBarOptions: {
      showLabel: false, // アイコン下のラベル表示
        activeTintColor: '#333', // アクティブなタブの色
        inactiveTintColor: '#bbb', // アクティブではないタブの色
        style: {
        backgroundColor: Constants.manifest.extra.backgroundColor,
      },
    },
    tabBarComponent: TabBar,
      tabBarPosition: 'bottom',
    animationEnabled: false,
    swipeEnabled: false,
  }
);
