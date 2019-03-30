import React from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  Share,
  ActivityIndicator,
} from 'react-native';
import { WebBrowser } from 'expo';

/* from app */
import firebase from 'app/src/firebase';
import FlatList from 'app/src/components/FlatList';
import Item from 'app/src/components/Item';
import Text from 'app/src/components/Text';
import styles from './styles';


export default class HomeScreen extends React.Component {
  static navigationOptions = () => ({
    headerTitle: 'フィード',
  });

  constructor(props) {
    super(props);

    this.state = {
      posts: [],
      fetching: false,
      loading: false,
    };
  };

  async componentDidMount() {
    await this.getPosts();
  }

  async componentDidUpdate(prevProps) {
    const { isFocused } = this.props;

    if (!prevProps.isFocused && isFocused && prevProps.currentScreen === 'TakePublish') {
      await this.getPosts();
    }
  }

  getPosts = async (cursor = null) => {
    this.setState({ fetching: true });

    // 全体の投稿を取得するgetPosts() メソッドでdata、cursorを返す
    const response = await firebase.getPosts(cursor);

    if (!response.error) {
      const { posts } = this.state;

      this.setState({
        posts: cursor ? posts.concat(response.data) : response.data,
        cursor: response.cursor,
      });
    }

    this.setState({ fetching: false });
  };

  onUserPress = (item) => {
    const { navigation } = this.props;

    // item.user のUserScreenに遷移
    navigation.push('User', { uid: item.user.uid });
  };

  onMorePress = (item) => {
    // シェアファイアログを開く
    Share.share({
      message: item.fileUri, // テキストとして画像のURLを渡す
    });
  };

  onLikePress = async (item) => {
    // TODO: いいねの処理
  };

  onLinkPress = (url, txt) => {
    const { navigation } = this.props;

    switch (txt[0]) {
      case '#':
        navigation.push('Tag', { tag: txt });
        break;
      default:
        WebBrowser.openBrowserAsync(url);
        break;
    }
  };

  onRefresh = async () => {
    this.setState({ cursor: null });
    await this.getPosts();
  };

  onEndReached = async () => {
    const { cursor, loading } = this.state;

    if (!loading && cursor) {
      this.setState({ loading: true });
      await this.getPosts(cursor);
      this.setState({ loading: false });
    }
  };

  render() {
    const {
      posts,
      fetching,
      loading,
    } = this.state;

    if (posts.length === 0) {
      return (
        <ScrollView
          style={styles.container}
          contentContainerStyle={[styles.container, styles.empty]}
        >
          <Text font="noto-sans-bold" style={styles.emptyText}>
            投稿はありません
          </Text>
        </ScrollView>
      );
    }

    return (
      <View style={styles.container} testID="Home">
        <FlatList
          data={posts}
          keyExtractor={item => item.key}
          renderItem={({ item, index, viewableItemIndices }) => (
            <Item
              {...item}
              visible={viewableItemIndices.indexOf(index) > -1}
              onUserPress={this.onUserPress}
              onMorePress={this.onMorePress}
              onLikePress={this.onLikePress}
              onLinkPress={this.onLinkPress}
            />
          )}
          ListFooterComponent={() => (
            loading ? <View style={styles.loading}><ActivityIndicator size="small" /></View> : null
          )}
          refreshControl={(
            <RefreshControl
              refreshing={fetching}
              onRefresh={this.onRefresh}
            />
          )}
          onEndReachedThreshold={0.1}
          onEndReached={this.onEndReached}
        />
      </View>
    );
  }
}
