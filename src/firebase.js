import uuid from 'uuid';
import { Constants } from 'expo';
import * as firebase from 'firebase';
import 'firebase/firestore';

// symbol polyfills
global.Symbol = require('core-js/es6/symbol');
require('core-js/fn/symbol/iterator');

// collection fn polyfills
require('core-js/fn/map');
require('core-js/fn/set');
require('core-js/fn/array/find');


class Firebase {
  constructor(config = {}) {
    firebase.initializeApp(config);

    // Timestamp型を扱えるようにする
    firebase.firestore().settings({ timestampsInSnapshots: true });

    // Userコレクションへの参照を取得
    this.user = firebase.firestore().collection('user');
  }

  // 匿名ログインユーザーを取得
  init = async() => new Promise(resolve => firebase.auth().onAuthStateChanged(async (user) => {
    if (!user){
      // 匿名でのログイン
      await firebase.auth().signInAnonymously();
      this.uid = (firebase.auth().currentUser || {}).uid;

      // ユーザードキュメントを作成または上書き
      this.user.doc(`${this.uid}`).set({
        name: Constants.deviceName,
      });
    } else {
      this.uid = user.uid;
    }

    resolve(this.uid);
  }));

  // ユーザー情報の取得
  getUser = async (uid = null) => {
    // uidが渡されていなければ、匿名ログインユーザーのuidを使用する
    const userId = (!uid) ? this.uid : uid;

    try {
      // ユーザーデータを取得
      const user = await this.user.doc(userId).get().then(res => res.data());

      return {
        uid: userId,
        name: user.name,
        img: user.img,
      };

    } catch ({ message }) {
      return { error: message };
    }
  };

  // ファイルのアップロード
  uploadFileAsync = async (uri) => {
    // uriを区切り文字'.'で区切って配列の最後の要素を取得する
    const ext = uri.split('.').slice(-1)[0];

    // 一意のパスを定義
    const path = `file/${this.uid}/${uuid.v4()}.${ext}`;

    return new Promise(async (resolve, reject) => {
      // uriをfetchしてレスポンスをBlob形式で取得
      const blob = await fetch(uri).then(response => response.blob());

      // firebase上のファイルのリファレンスを取得
      const ref = firebase.storage().ref(path);

      // Blob形式でファイルをCloud StorageにアップロードしてURLを返す
      const unsubscribe = ref.put(blob).on('state_changed',
        (state) => {},
        (err) => {
          unsubscribe();
          reject(err);
        },
        async () => {
          unsubscribe();
          const url = await ref.getDownloadURL();
          resolve(url);
        });
    });
  };

  // ユーザーのプロフィール写真を変更
  changeUserImg = async (file = '') => {
    try {
      // Cloud Storageにファイルをアップロード
      const remoteUri = await this.uploadFileAsync(file.uri);

      // アップロード先のURLをFirestore上のユーザードキュメントに保存
      this.user.doc(`${this.uid}`).update({
        img: remoteUri,
      });

      return remoteUri;

    } catch ({ message }) {
      return { error: message };
    }
  };
}

const fire = new Firebase(Constants.manifest.extra.firebase);
export default fire;
