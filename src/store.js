import { createStore, combineReducers, applyMiddleware } from 'redux';
import { createReactNavigationReduxMiddleware } from 'react-navigation-redux-helpers';

/* from app */
import { getActiveRouteName } from 'app/src/navigation/AppNavigator';
import reducers from 'app/src/reducers';

const logger = () => next => (action) => {
  // 開発環境のみ
  if (__DEV__) {
    if (action.type.indexOf('Navigation') === -1) {
      console.log(action);
    }
  }
  next(action);
};

// 画面遷移を追跡
const screenTracking = store => next => (action) => {
  if (action.type.indexOf('Navigation') === -1 || action.type === 'TAKEMODAL_CLOSE') {
    return next(action);
  }

  // 遷移前のrouteNameを取得
  const currentScreen = getActiveRouteName(store.getState().nav);
  const result = next(action);

  // 遷移後のrouteNameを取得
  const nextScreen = getActiveRouteName(store.getState().nav);

  store.dispatch({
    type: 'SCREEN_SET',
    payload: {
      current: currentScreen,
      next: nextScreen,
    },
  });

  return result;
};

/* create store */
const store = createStore(
  combineReducers({ ...reducers }), // 1つのreducerにまとめる
  applyMiddleware( // ActionがReducerに到達する前にmiddlewareがキャッチできるようにする関数
    createReactNavigationReduxMiddleware( // react-navigationにおいてreduxのmiddlewareを作るために必要な関数
      'root',
      state => state.nav,
    ),
    logger,
    screenTracking,
  ),
);

export default store;
