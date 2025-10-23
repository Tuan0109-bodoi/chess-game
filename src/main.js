import Phaser from "phaser";
import GameScene from "./scenes/GameScene.js";

const config = {
  type: Phaser.AUTO,
  parent: "game",           // gắn vào div trong index.html
  backgroundColor: "#000000", // tạm màu đen (ảnh sẽ phủ lên)
  scale: {
    mode: Phaser.Scale.FIT, // luôn fit vừa màn hình
    autoCenter: Phaser.Scale.CENTER_BOTH, // canh giữa
    width: 640,             // kích thước logic
    height: 640,
  },
  scene: [GameScene],
};

const game = new Phaser.Game(config);
