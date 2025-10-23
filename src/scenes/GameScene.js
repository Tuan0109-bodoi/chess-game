import { Chess } from "chess.js";

export default class GameScene extends Phaser.Scene {
  preload() {
    // Load ảnh quân cờ & bàn cờ
    const pieces = ['p', 'r', 'n', 'b', 'q', 'k'];
    for (const p of pieces) {
      this.load.image('w' + p, 'assets/pieces/w' + p + '.png');
      this.load.image('b' + p, 'assets/pieces/b' + p + '.png');
    }
    this.load.image('board', 'assets/board.png');
  }

  create() {
    // Tạo game logic
    this.chess = new Chess();
    this.selectedSquare = null;

    // lưu tileSize ra this để dùng ở chỗ khác
    this.tileSize = 80;

    // Vẽ bàn cờ (board) và sau đó tạo ô highlight (ẩn ban đầu)
    this.add.image(0, 0, 'board').setOrigin(0).setDisplaySize(640, 640).setDepth(0);

    // highlight dưới quân khi chọn (màu #b6cc45, alpha 0.5)
    this.selectedHighlight = this.add.rectangle(0, 0, this.tileSize, this.tileSize, 0xb6cc45, 0.5)
      .setOrigin(0.5)
      .setVisible(false)
      .setDepth(1);

    // Lưu sprite quân cờ
    this.pieceSprites = {};

    // Khởi tạo bàn
    const board = this.chess.board();
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const square = this.coordToSquare(row, col);
        const piece = board[row][col];
        if (piece) {
          const key = piece.color + piece.type;
          const sprite = this.add.image(
            col * this.tileSize + this.tileSize / 2,
            row * this.tileSize + this.tileSize / 2,
            key
          )
            .setOrigin(0.5)
            .setScale(80 / 150)
            .setInteractive()
            .setDepth(2); // Đảm bảo depth > highlight

          sprite.row = row;
          sprite.col = col;
          this.pieceSprites[square] = sprite;

          // 👉 Gắn click cho mỗi quân
          sprite.on("pointerdown", () => this.onPieceClick(sprite));
        }
      }
    }
  }

  // 🧠 Khi click vào quân
  onPieceClick(sprite) {
    // bỏ chọn cũ nếu có
    if (this.selectedSprite && this.selectedSprite !== sprite) {
      this.selectedSprite.clearTint?.();
    }

    const square = this.coordToSquare(sprite.row, sprite.col);
    const piece = this.chess.get(square);
    if (!piece) return;

    // toggle chọn/deselect
    if (this.selectedSquare === square) {
      this.selectedSquare = null;
      this.selectedSprite = null;
      sprite.clearTint?.();
      this.clearMoveHints();
      // ẩn highlight
      if (this.selectedHighlight) this.selectedHighlight.setVisible(false);
      return;
    }

    // chọn quân mới
    this.selectedSquare = square;
    this.selectedSprite = sprite;
    sprite.setTint(0xb6cc45); // giữ tint nếu muốn

    // show highlight trên ô được chọn
    const cx = sprite.col * this.tileSize + this.tileSize / 2;
    const cy = sprite.row * this.tileSize + this.tileSize / 2;
    if (this.selectedHighlight) {
      this.selectedHighlight.setPosition(cx, cy).setVisible(true);
    }

    // show possible moves
    const moves = this.chess.moves({ square, verbose: true }) || [];
    this.showMoveHints(moves);
  }

  // Hiển thị hint các ô có thể đi
  showMoveHints(moves) {
    this.clearMoveHints();
    if (!moves || moves.length === 0) return;
    const files = ["a","b","c","d","e","f","g","h"];
    const HINT_COLOR = 0xb6cc45; // #b6cc45
    for (const m of moves) {
      const to = m.to; // e.g. "e4"
      const col = files.indexOf(to[0]);
      const row = 8 - parseInt(to[1], 10);
      const cx = col * this.tileSize + this.tileSize / 2;
      const cy = row * this.tileSize + this.tileSize / 2;
      // interactive hint with the requested color
      const hint = this.add.circle(cx, cy, 12, HINT_COLOR, 0.35)
        .setDepth(2)
        .setInteractive({ cursor: 'pointer' });
      // if you have performMove(to) defined it will be called; otherwise remove the next line
      hint.on('pointerdown', () => this.performMove?.(to));
      this.hintsGroup.add(hint);
    }
  }

  clearMoveHints() {
    if (this.hintsGroup) this.hintsGroup.clear(true, true);
    // ẩn highlight khi clear
    if (this.selectedHighlight) this.selectedHighlight.setVisible(false);
  }

  // 🧩 Hàm update lại sprite theo board của chess.js
  updateBoardSprites() {
    const board = this.chess.board();
    const tileSize = 80;
    const pieceScale = 80 / 150;

    // Xóa sprite cũ
    for (const s in this.pieceSprites) {
      this.pieceSprites[s].destroy();
    }
    this.pieceSprites = {};

    // Render lại
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const square = this.coordToSquare(row, col);
        const piece = board[row][col];
        if (piece) {
          const key = piece.color + piece.type;
          const sprite = this.add.image(
            col * tileSize + tileSize / 2,
            row * tileSize + tileSize / 2,
            key
          )
            .setOrigin(0.5)
            .setScale(pieceScale)
            .setInteractive();

          sprite.row = row;
          sprite.col = col;
          this.pieceSprites[square] = sprite;

          sprite.on("pointerdown", () => this.onPieceClick(sprite));
        }
      }T
    }
  }

 
  coordToSquare(row, col) {
    const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
    return files[col] + (8 - row);
  }
}
