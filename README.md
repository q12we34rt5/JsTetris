# ![](https://i.imgur.com/yb4E23m.png) &nbsp; JsTetris


透過 JavaScript 編寫的 Tetris 小遊戲。  
遊戲網址： https://q12we34rt5.github.io/JsTetris/

## 簡介

一款介面簡潔的俄羅斯方塊小遊戲，可用於放鬆、練習、娛樂，無計分系統，可自定義鍵盤操作。

旋轉系統：[SRS（Super Rotation System）](https://tetris.fandom.com/wiki/SRS)

![](https://i.imgur.com/xrUIqIj.png)

## 設定

將滑鼠移至左上角的齒輪即可開啟設定欄，設定完成後需要按下最底下的 **Save** 儲存變更。

![](https://i.imgur.com/B0wujkV.gif)

### 鍵盤設定

- Move Left: 左移方塊
- Move Right: 右移方塊
- Soft Drop: 緩降
- Hard Drop: 瞬降
- Rotate Left: 逆時鐘旋轉
- Rotate Right: 順時鐘旋轉
- Rotate 180: 180 度旋轉
- Hold: 保存方塊

![](https://i.imgur.com/v43y9kH.gif)

### 遊戲設定

- Drop rate: 方塊掉落速度（毫秒）
- DAS: 從按下左移或右移到方塊開始自動移動之間的時間間隔
- ARR: 方塊水平自動移動的速度
- Drop DAS: 從按下緩降到方塊開始自動緩降之間的時間間隔
- Drop ARR: 方塊自動緩降的速度
- Screen speed: 畫面更新率（毫秒）
- Width: 遊戲寬度
- Height: 遊戲高度

![](https://i.imgur.com/ZYc7cmO.gif)

### 方塊樣式

提供 21 種方塊樣式與 2 種影子。

![](https://i.imgur.com/TzUMLLO.gif)

## 開發目的

因為剛開始接觸網頁設計，為了要快速上手，就選擇了遊戲，而我也很喜歡撰寫遊戲。

會選擇寫俄羅斯方塊的主要原因是最近看到了別人寫的 AI，覺得很感興趣，而要寫出 AI，就必須先對遊戲有一定的了解，同時也需要可以隨時測試的環境。

## 未來發展

目前想將其擴充為可多人遊戲的版本，前端透過 WebSocket 與後端做即時溝通，後端暫時由 Node.js 編寫，目前的測試版本也放在 GitHub Page 上，但發現其似乎不提供 WebSocket 功能，因此也只能提供單人遊玩的功能。

測試版本：https://q12we34rt5.github.io/sources/TetrisMuti/
