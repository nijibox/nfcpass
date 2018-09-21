# nfcpass

Google Chromeに搭載されているWebUSB APIを使って、NFCカードリーダー(PaSoRi限定)でカード情報の読み取りを行う単機能パッケージです。

## 機能

USB接続された、PaSoRiを通してNFC規格のカードから以下の情報を取得します。

* IDm
* PMm

## 使い方

原時点では、npmパッケージのみでの提供となります。（隙間を縫って、`<script>`タグでの利用も可能にする想定です）

### Webpackでの組み込み

#### 1. npmで使用するように設定

```
npm i -S nijibox/nfcpass
```

#### 2. 組み込み

(すごく雑な例)

```
import { DeviceLoader } from 'nfcpass'

document.getElementById('button-nfcpass')
  .addEventListener('click', async (e) => {
    // ここにカードリーダー接続
    try {
      device = await DeviceLoader.connectDevice()
    } catch (err) {
      console.error(err)
      alert(err.message)
      return
    }
    // 読み取りループ
    let idm = ''
    while (true) {
      console.debug('Waiting...')
      const card = await device.readCardInfo()
      if (!card.idm) {
        continue
      }
      console.log(`IDm is ${card.idm}`)
      break
    }
  })

```



## 対応状況

作者は以下の環境で動作確認をしています。

* macOS High Sierra + Google Chrome 69

