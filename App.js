import React from 'react';
import {
  AppLoading,
  Asset,
  Font
} from 'expo';
import fonts from 'app/src/fonts';
import images from 'app/src/images';
import Navigation from "app/src";

export default class App extends React.Component {
  static defaultProps = {
    skipLoadingScreen: false,
  };

  constructor(props) {
    super(props);

    this.state = {
      isLoadingComplete: false,
    };
  }

  loadResourcesAsync = async () => {
    // ローカルフォルダーから画像をロード
    await Asset.loadAsync(Object.keys(images).map(key => images[key]));
    // ローカルフォルダーからフォントのロード
    await Font.loadAsync(fonts);

    return true;
  };

  render() {
    const { isLoadingComplete } = this.state;
    const { skipLoadingScreen } = this.props;

    // リソースのロードが終わるまでAppLoadingをrender
    if (!isLoadingComplete && !skipLoadingScreen) {
      return (
        <AppLoading
          // 非同期でリソースをロード
          startAsync={this.loadResourcesAsync}
          onError={error => console.warn(error)}
          // リソースのロードが終わったらロードを終了
          onFinish={() => this.setState({
            isLoadingComplete: true
          })}
        />
      );
    }

    return (
      <Navigation />
    );
  }
}

