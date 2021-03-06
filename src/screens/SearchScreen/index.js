import React from 'react';
import {
  View,
  TouchableHighlight,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-navigation';

/* from app */
import FlatList from 'app/src/components/FlatList';
import Text from 'app/src/components/Text';
import styles from './styles';

export default class SearchScreen extends React.Component {
  static navigationOptions = {
    header: null,
  };

  constructor(props) {
    super(props);

    this.state = {
      keyword: null,
      tags: [],
      searching: false,
    };
  }

  // 検索文字列が変化した際の処理
  onChangeText = (text) => {
  };

  onRowPress = (item) => {
    // TagScreenを開く
  };

  render() {
    const {
      keyword,
      tags,
      searching,
    } = this.state;

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.container}>
          <FlatList
            data={tags}
            keyExtractor={item => item.key}
            ListHeaderComponent = {(
              <View style={styles.header}>
                <TextInput
                  style={styles.search}
                  value={keyword}
                  placeholder={"タグを入力して検索しましょう"}
                  underlineColorAndroid={"transparent"}
                  onChangeText={this.onChangeText}
                  clearButtonMode={"while-editing"}
                />
              </View>
            )}
            renderItem = {({ item }) => {
              if (searching) {
                return null;
              }

              return (
                <TouchableHighlight underlayColor={"rgba(0, 0, 0, 0.1)"} style={styles.row} onPress={() => this.onRowPress(item)}>
                  <Text font={"noto-sans-medium"} style={styles.rowText}>#{item.name}</Text>
                </TouchableHighlight>
              );
            }}
            LIstFooterComponent={() => ((searching && keyword) ?
                <Text font={"noto-sans-medium"} style={styles.searching}>#{keyword}</Text> :
                null
            )}
          />
        </View>
      </SafeAreaView>
    );
  }
}
