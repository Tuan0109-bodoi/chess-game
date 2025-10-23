import { Chess } from "chess.js";

export default class GameScene extends Phaser.Scene {
  preload() {
    // Load quân cờ
    const pieces = ['p', 'r', 'n', 'b', 'q', 'k'];
    for (const p of pieces) {
      this.load.image('w' + p, 'assets/pieces/w' + p + '.png');
      this.load.image('b' + p, 'assets/pieces/b' + p + '.png');
    }

    // Load ảnh bàn cờ
    this.load.image('board', 'assets/board.png');
  }

  create() {
    // Khởi tạo chess.js
    this.chess = new Chess();

    const tileSize = 80;

    // Hiển thị bàn cờ
    const board = this.add.image(0, 0, 'board').setOrigin(0);
    board.setDisplaySize(this.scale.width, this.scale.height);
    board.setDepth(0);

    // Vị trí ban đầu
    const startPosition = [
      ["br", "bn", "bb", "bq", "bk", "bb", "bn", "br"],
      ["bp", "bp", "bp", "bp", "bp", "bp", "bp", "bp"],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      ["wp", "wp", "wp", "wp", "wp", "wp", "wp", "wp"],
      ["wr", "wn", "wb", "wq", "wk", "wb", "wn", "wr"]
    ];

    const pieceScale = 80 / 150;
    // Render quân cờ
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = startPosition[row][col];
        if (piece) {
          const sprite = this.add.image(
            col * tileSize + tileSize / 2,
            row * tileSize + tileSize / 2,
            piece
          )
            .setOrigin(0.5)
            .setScale(pieceScale)
            .setDepth(1);

          sprite.row = row;
          sprite.col = col;
          sprite.setInteractive(); // cho phép click
          sprite.on("pointerdown", () => this.onPieceClick(sprite));
        }
      }
    }
  }
    onPieceClick(sprite) {
    const square = this.coordToSquare(sprite.row, sprite.col);
    console.log("Clicked on", square);
  }

}
