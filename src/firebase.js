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

    // コレクションへの参照を取得
    this.user = firebase.firestore().collection('user');
    this.post = firebase.firestore().collection('post');
    this.tag = firebase.firestore().collection('tag');
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

  // 投稿の作成
  createPost = async (text = '', file = '', type = 'photo') => {
    try {
      // CloudStrageにファイルをアップロードする
      const remoteUri = await this.uploadFileAsync(file.uri);
      const tags = text.match(/[#]{0,2}?(w*[一-龠_ぁ-ん_ァ-ヴーａ-ｚＡ-Ｚa-zA-Z0-9]+|[a-zA-Z0-9_]+|[a-zA-Z0-9_]w*)/gi);

      // 投稿をFirestoreに保存
      await this.post.add({
        text,
        timestamp: Date.now(),
        type,
        fileWidth: (type === 'photo') ? file.width : null,
        fileHeight: (type === 'photo') ? file.height : null,
        fileUri: remoteUri, // ファイルのアップロード先のURLを格納
        user: this.user.doc(`${this.uid}`), // ユーザー情報への参照
        tag: tags ? tags.reduce((acc, cur) => {
            acc[cur.replace(/#/, '')] = Date.now();
            return acc;
          }, {}) : null,
      });

      if (tags) {
        await Promise.all(tags.map((tag) => {
          const t = tag.replace(/^#/, '');

          // タグドキュメントを作成または上書きする
          this.tag.doc(t).set({
            name: t,
          });
        }));
      }

      return true;
    } catch ({ message }) {
      return { error: message };
    }
  };

  // 投稿の取得
  getPost = async (pid = '0') => {
    try {
      const post = await this.post.doc(pid).get().then(res => res.data());
      const user = await post.user.get().then(res => res.data());

      user.uid = post.user.id;
      delete post.user;

      // 投稿がいいね済みかどうか確認
      const liked = await this.user.doc(`${this.uid}`).collection('liked').doc(pid).get()
        .then(res => res.exists);

      return {
        pid,
        ...post,
        liked,
        user,
      };

    } catch ({ message }) {
      return { error: message };
    }
  };

  // 投稿の一覧を取得
  getPosts = async (cursor = null, num = 5) => {
    // timestampの降順で並び替えて最初のnum個の投稿を取得
    let ref = this.post.orderBy('timestamp', 'desc').limit(num);

    try {
      if (cursor) {
        ref = ref.startAfter(cursor); // クエリの開始点を定義
      }

      const querySnapshot = await ref.get();
      const data = [];
      await Promise.all(querySnapshot.docs.map(async (doc) => {
        if (doc.exists) {
          const post = doc.data() || {};

          const user = await post.user.get().then(res => res.data());
          user.uid = post.user.id;
          delete post.user;

          const liked = await this.user.doc(`${this.uid}`).collection('liked').doc(doc.id).get()
            .then(res => res.exists);

          data.push({
            key: doc.id,
            pid: doc.id,
            user,
            ...post,
            liked,
          });
        }
      }));

      // querySnapshot.docが存在したら最後のドキュメントを、なければnullを代入する
      const lastVisible = querySnapshot.docs.length > 0 ?
        querySnapshot.docs[querySnapshot.docs.length - 1] : null;

      return { data, cursor: lastVisible };

    } catch ({ message }) {
      return { error: message };
    }
  }
}

const fire = new Firebase(Constants.manifest.extra.firebase);
export default fire;
